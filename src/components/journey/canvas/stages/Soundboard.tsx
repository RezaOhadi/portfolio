"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  CanvasTexture,
  Color,
  CatmullRomCurve3,
  Mesh,
  MeshStandardMaterial,
  Plane,
  PlaneGeometry,
  Raycaster,
  TubeGeometry,
  Vector2,
  Vector3,
  type PointLight,
  type WebGLProgramParametersWithUniforms,
} from "three";
import { playNote } from "../../audio";
import { journey, range } from "../../store";
import { createMaterial } from "../piano/materials";
import { rimPoints } from "../piano/outline";
import { pointerRay } from "../PianoParts";
import { ease, rig } from "../rig";
import { BOARD, boardRipple, boardShared, boardX, boardZ, dropRipple, RIPPLE_GLSL } from "./boardLayout";

/**
 * World 6, the Soundboard. A spruce board in the grand piano's own outline,
 * with grain and a gold bridge. Resonance ripples run across it in the vertex
 * shader (normals from the same function), crests catch gold, and the motes
 * settle on it like sand. Clicking drops a note into the board; ripples from
 * several notes interfere. The gallery photographs float above it and bob on
 * the same waves.
 */

const PLANE = new Plane(new Vector3(0, 1, 0), -BOARD.y);
const _hit = new Vector3();
const WOOD = new Color("#6d4c2c");
const FLOOR = new Color("#24170c");
const _ndc = new Vector2();
/** Private ray for the floating photographs, so R3F pointer picking is untouched. */
const _ray = new Raycaster();
/** Db pentatonic, low: notes dropped into the board. */
const DROPS = [37, 39, 42, 44, 46, 49, 51];

/** The piano's outline as a mask texture over the board's bounding rectangle. */
function outlineMask() {
  const pts = rimPoints(200).map(({ p }) => new Vector2(boardX(p.x), boardZ(p.y)));
  pts.push(new Vector2(boardX(0.74), boardZ(0)), new Vector2(boardX(-0.74), boardZ(0)));
  const xs = pts.map((p) => p.x), zs = pts.map((p) => p.y);
  const bounds = { x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs) };
  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  pts.forEach((p, i) => {
    const u = ((p.x - bounds.x0) / (bounds.x1 - bounds.x0)) * size;
    const v = ((bounds.z1 - p.y) / (bounds.z1 - bounds.z0)) * size;
    if (i === 0) ctx.moveTo(u, v);
    else ctx.lineTo(u, v);
  });
  ctx.closePath();
  ctx.fill();
  return { texture: new CanvasTexture(canvas), bounds };
}

function rippleBoard(material: MeshStandardMaterial) {
  const base = material.onBeforeCompile;
  material.onBeforeCompile = (shader: WebGLProgramParametersWithUniforms, renderer) => {
    base.call(material, shader, renderer);
    Object.assign(shader.uniforms, boardShared);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n${RIPPLE_GLSL}\nvarying float vRipple;\nvarying vec2 vBoard;`)
      .replace(
        "#include <beginnormal_vertex>",
        `float e = 0.06;
        float hx = boardRipple(position.xz + vec2(e, 0.0)) - boardRipple(position.xz - vec2(e, 0.0));
        float hz = boardRipple(position.xz + vec2(0.0, e)) - boardRipple(position.xz - vec2(0.0, e));
        vec3 objectNormal = normalize(vec3(-hx / (2.0 * e), 1.0, -hz / (2.0 * e)));
        #ifdef USE_TANGENT
          vec3 objectTangent = vec3(tangent.xyz);
        #endif`,
      )
      .replace(
        "#include <begin_vertex>",
        `vec3 transformed = vec3(position);
        float rip = boardRipple(position.xz);
        transformed.y += rip;
        vRipple = rip;
        vBoard = position.xz;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying float vRipple;\nvarying vec2 vBoard;")
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        // Spruce: fine straight grain along the length, a slow figure across it.
        float g = sin(vBoard.x * 46.0 + sin(vBoard.y * 0.9) * 2.2) * 0.5 + 0.5;
        float figure = sin(vBoard.x * 7.0 + vBoard.y * 0.35) * 0.5 + 0.5;
        diffuseColor.rgb *= mix(0.74, 1.06, g) * mix(0.88, 1.04, figure);`,
      )
      .replace(
        "#include <dithering_fragment>",
        `#include <dithering_fragment>
        gl_FragColor.rgb += uGold * smoothstep(0.004, 0.05, vRipple) * 1.6;`,
      );
  };
  material.customProgramCacheKey = () => "fx-board";
}

export function Soundboard() {
  const root = useRef<Mesh>(null);
  const bridge = useRef<Mesh>(null);
  const lamp = useRef<PointLight>(null);
  const tiles = useRef<{ list: HTMLElement[]; checked: number }>({ list: [], checked: 0 });
  const last = useRef({ ambient: 0 });

  const built = useMemo(() => {
    const { texture, bounds } = outlineMask();
    const width = bounds.x1 - bounds.x0;
    const depth = bounds.z1 - bounds.z0;
    const geometry = new PlaneGeometry(width, depth, 190, 260);
    geometry.rotateX(-Math.PI / 2);
    geometry.translate((bounds.x0 + bounds.x1) / 2, BOARD.y, (bounds.z0 + bounds.z1) / 2);
    const fx = createMaterial("spruce", { rim: 0.4 });
    const material = fx.material as MeshStandardMaterial;
    material.color.copy(WOOD);
    material.alphaMap = texture;
    material.alphaTest = 0.5;
    rippleBoard(material);
    const bridgeFx = createMaterial("gold");
    const curve = new CatmullRomCurve3([
      new Vector3(boardX(0.6), BOARD.y + 0.05, boardZ(0.55)),
      new Vector3(boardX(0.28), BOARD.y + 0.05, boardZ(0.92)),
      new Vector3(boardX(-0.12), BOARD.y + 0.05, boardZ(1.32)),
      new Vector3(boardX(-0.44), BOARD.y + 0.05, boardZ(1.76)),
    ]);
    const bridgeGeo = new TubeGeometry(curve, 96, 0.05, 6);
    return { geometry, material, fx, texture, bridgeGeo, bridgeFx };
  }, []);

  useEffect(
    () => () => {
      built.geometry.dispose();
      built.fx.material.dispose();
      built.texture.dispose();
      built.bridgeGeo.dispose();
      built.bridgeFx.material.dispose();
    },
    [built],
  );

  // Clicking the board drops a note into it.
  useEffect(() => {
    const down = (event: PointerEvent) => {
      if (!rig.show.board || journey.reduced) return;
      const el = event.target as Element | null;
      if (el?.closest?.("a, button, input, textarea, select, dialog, .gallery-tile")) return;
      const hit = new Vector3();
      if (pointerRay.intersectPlane(PLANE, hit)) {
        dropRipple(hit.x, hit.z, 1.2);
        if (journey.sound) playNote(DROPS[Math.floor(Math.random() * DROPS.length)], 0.5, 4);
      }
    };
    window.addEventListener("pointerdown", down);
    return () => window.removeEventListener("pointerdown", down);
  }, []);

  useFrame((state) => {
    const mesh = root.current;
    if (!mesh) return;
    const visible = rig.show.board;
    mesh.visible = visible;
    if (bridge.current) bridge.current.visible = visible;
    boardShared.uBoardTime.value = rig.time;
    if (!visible) return;
    // At the end the board rises to become the floor the rebuilt piano stands on.
    const floor = ease.settle(range(rig.reassemble, 0.35, 1)) * -BOARD.y;
    mesh.position.y = floor;
    built.material.color.lerpColors(WOOD, FLOOR, ease.settle(range(rig.reassemble, 0.3, 1)));
    // A warm pool of light hangs over the board, following the eye; it gives way to the studio at the end.
    if (lamp.current) {
      lamp.current.position.set(rig.focus.x + 0.5, BOARD.y + floor + 2.8, rig.focus.z + 0.4);
      // The lamp dims once the name has formed, so the quote reads against a darker floor.
      lamp.current.intensity = rig.show.piano ? 0 : 14 * (1 - range(rig.morph, 0.55, 1) * 0.7);
    }
    if (bridge.current) bridge.current.position.y = floor;

    // The world breathes by itself: notes fall into the board as you read and scroll.
    // Notes stop falling once the piano is rebuilt: the board becomes a quiet stage floor.
    const lively = (rig.soundboard > 0.01 || rig.dissolve > 0.6) && !rig.show.piano;
    const gap = 1.7 - rig.velocity * 1.2;
    if (lively && !journey.reduced && rig.time - last.current.ambient > gap) {
      last.current.ambient = rig.time;
      const target = rig.focus;
      dropRipple(target.x + (Math.random() - 0.5) * 5, target.z + (Math.random() - 0.5) * 6, 0.8 + rig.velocity);
    }

    // Gallery photographs float on the waves: ray from the lens through each tile onto the board.
    const t = tiles.current;
    if (rig.time - t.checked > 2) {
      t.list = Array.from(document.querySelectorAll<HTMLElement>("#gallery .gallery-tile"));
      t.checked = rig.time;
    }
    if (rig.soundboard > 0 && rig.soundboard < 1 && !journey.reduced) {
      for (const tile of t.list) {
        const r = tile.getBoundingClientRect();
        if (r.bottom < 0 || r.top > state.size.height) continue;
        _ndc.set(((r.left + r.width / 2) / state.size.width) * 2 - 1, -((r.top + r.height / 2) / state.size.height) * 2 + 1);
        _ray.setFromCamera(_ndc, state.camera);
        if (_ray.ray.intersectPlane(PLANE, _hit)) {
          const h = boardRipple(_hit.x, _hit.z);
          tile.style.translate = `0 ${(-h * 260).toFixed(1)}px`;
          tile.style.rotate = `${(h * 30).toFixed(2)}deg`;
        }
      }
    } else if (t.list.length) {
      for (const tile of t.list) {
        tile.style.translate = "";
        tile.style.rotate = "";
      }
    }
  }, -1);

  return (
    <>
      <mesh ref={root} geometry={built.geometry} material={built.material} visible={false} />
      <mesh ref={bridge} geometry={built.bridgeGeo} material={built.bridgeFx.material} visible={false} />
      <pointLight ref={lamp} color="#f3d6ae" intensity={0} distance={11} decay={1.5} visible={journey.tier !== "touch"} userData={{ stageLamp: 1 }} />
    </>
  );
}
