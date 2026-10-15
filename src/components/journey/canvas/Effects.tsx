"use client";

import { useFrame } from "@react-three/fiber";
import { Bloom, ChromaticAberration, DepthOfField, EffectComposer, Noise, ToneMapping, Vignette } from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode, type BloomEffect, type ChromaticAberrationEffect, type DepthOfFieldEffect } from "postprocessing";
import { useRef, useState } from "react";
import { touchQuality } from "./quality";
import { MathUtils } from "three";
import { HalfFloatType, Vector2 } from "three";
import { range } from "../store";
import { rig } from "./rig";

/**
 * Bloom only catches what is pushed past 1.0 (hot dust, burning edges, the
 * gold highlight). Aberration exists only while something moves: it scales
 * with scroll velocity and the burst. Depth of field opens in the exploded
 * world on capable GPUs.
 */
export function Effects({ dof, dofOn, multisampling, lite = false, post = true }: { dof: boolean; dofOn: { current: boolean }; multisampling: number; lite?: boolean; post?: boolean }) {
  // The lite tier draws straight to the screen: no composer, no extra passes.
  if (!post) return null;
  if (lite) return <TouchEffects />;
  return <DesktopEffects dof={dof} dofOn={dofOn} multisampling={multisampling} />;
}

/**
 * Phones and tablets: tone mapping and vignette, plus a half-resolution, softer
 * bloom. No depth of field, aberration or grain. Bloom is left out on weak
 * GPUs, and dropped for good if the governor's last step is reached.
 */
function TouchEffects() {
  const bloom = useRef<BloomEffect>(null);
  const [bloomOn, setBloomOn] = useState(touchQuality.bloom);
  useFrame(() => {
    if (bloomOn && !touchQuality.bloom) setBloomOn(false);
    if (bloom.current) bloom.current.intensity = (0.85 + rig.burst * 0.9 + rig.anticipation * 0.6 + rig.flash * 1.4) * 0.7;
  });
  return (
    <EffectComposer multisampling={0} frameBufferType={HalfFloatType} enableNormalPass={false}>
      {bloomOn ? <Bloom ref={bloom} mipmapBlur luminanceThreshold={0.92} luminanceSmoothing={0.18} intensity={0.6} radius={0.74} resolutionScale={0.5} /> : <></>}
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette offset={0.28} darkness={0.7} />
    </EffectComposer>
  );
}

function DesktopEffects({ dof, dofOn, multisampling }: { dof: boolean; dofOn: { current: boolean }; multisampling: number }) {
  const bloom = useRef<BloomEffect>(null);
  const aberration = useRef<ChromaticAberrationEffect>(null);
  const depth = useRef<DepthOfFieldEffect>(null);
  const offset = useRef(new Vector2());
  // The governor's depth-of-field switch, eased: the effect stays mounted and only its strength moves.
  const strength = useRef(1);

  useFrame((_, delta) => {
    strength.current = MathUtils.damp(strength.current, dofOn.current ? 1 : 0, 3, Math.min(delta, 1 / 20));
    if (bloom.current) bloom.current.intensity = 0.85 + rig.burst * 0.9 + rig.anticipation * 0.6 + rig.flash * 1.4;
    const ca = rig.velocity * 0.0016 + rig.burst * 0.0024 + rig.flash * 0.005;
    offset.current.set(ca, ca * 0.6);
    if (aberration.current) aberration.current.offset = offset.current;
    if (depth.current) {
      depth.current.target = rig.focus;
      // Shallow focus while parts float; it closes as the crane reaches eye level.
      depth.current.bokehScale = rig.dof * (1 - rig.snap * 0.7) * (1 - range(rig.exploded, 0.72, 1) * 0.65) * (1 - range(rig.dive, 0.4, 0.6) * 0.6) * 3.4 * strength.current;
      depth.current.cocMaterial.focusRange = 2.6;
    }
  });

  return (
    // Mounted once for the tier and never rebuilt mid-journey: a rebuild recompiles every pass.
    <EffectComposer multisampling={multisampling} frameBufferType={HalfFloatType} enableNormalPass={false}>
      {dof && <DepthOfField ref={depth} target={rig.focus} focusRange={2.6} bokehScale={0} resolutionScale={0.5} />}
      <Bloom ref={bloom} mipmapBlur luminanceThreshold={0.92} luminanceSmoothing={0.18} intensity={0.85} radius={0.74} />
      <ChromaticAberration ref={aberration} offset={offset.current} radialModulation modulationOffset={0.3} blendFunction={BlendFunction.NORMAL} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette offset={0.28} darkness={0.7} />
      <Noise premultiply opacity={0.38} />
    </EffectComposer>
  );
}
