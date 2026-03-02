"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  life: number;
  maxLife: number;
  size: number;
  shape: number;
  trail: THREE.Vector3[];
  trailLength: number;
}

interface Firework {
  rocket: {
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    color: THREE.Color;
    life: number;
    exploded: boolean;
  };
  particles: Particle[];
  burstShape: number;
}

const COLORS = [
  new THREE.Color(0xff4444),
  new THREE.Color(0xff8800),
  new THREE.Color(0xffdd00),
  new THREE.Color(0x44ff44),
  new THREE.Color(0x00ddff),
  new THREE.Color(0x4488ff),
  new THREE.Color(0xaa44ff),
  new THREE.Color(0xff44aa),
  new THREE.Color(0xff6633),
  new THREE.Color(0x33ffcc),
  new THREE.Color(0xffffff),
  new THREE.Color(0xffaacc),
];

function randomColor(): THREE.Color {
  return COLORS[Math.floor(Math.random() * COLORS.length)].clone();
}

function createParticleTextures(): THREE.Texture[] {
  const textures: THREE.Texture[] = [];
  const shapes = [
    () => {
      const canvas = document.createElement("canvas");
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext("2d");
      if (!ctx) return canvas;
      const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, "rgba(255,255,255,1)");
      gradient.addColorStop(0.3, "rgba(255,255,255,0.8)");
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 64, 64);
      return canvas;
    },
    () => {
      const canvas = document.createElement("canvas");
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext("2d");
      if (!ctx) return canvas;
      ctx.fillStyle = "rgba(255,255,255,0)";
      ctx.fillRect(0, 0, 64, 64);
      ctx.save();
      ctx.translate(32, 32);
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const angle = (i * Math.PI) / 5 - Math.PI / 2;
        const radius = i % 2 === 0 ? 28 : 12;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 28);
      gradient.addColorStop(0, "rgba(255,255,255,1)");
      gradient.addColorStop(0.5, "rgba(255,255,255,0.6)");
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.restore();
      return canvas;
    },
    () => {
      const canvas = document.createElement("canvas");
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext("2d");
      if (!ctx) return canvas;
      ctx.fillStyle = "rgba(255,255,255,0)";
      ctx.fillRect(0, 0, 64, 64);
      ctx.save();
      ctx.translate(32, 32);
      ctx.beginPath();
      ctx.moveTo(0, -28);
      ctx.lineTo(14, 0);
      ctx.lineTo(0, 28);
      ctx.lineTo(-14, 0);
      ctx.closePath();
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 28);
      gradient.addColorStop(0, "rgba(255,255,255,1)");
      gradient.addColorStop(0.6, "rgba(255,255,255,0.5)");
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.restore();
      return canvas;
    },
    () => {
      const canvas = document.createElement("canvas");
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext("2d");
      if (!ctx) return canvas;
      ctx.fillStyle = "rgba(255,255,255,0)";
      ctx.fillRect(0, 0, 64, 64);
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(32, 32, 20, 0, Math.PI * 2);
      ctx.stroke();
      const gradient = ctx.createRadialGradient(32, 32, 16, 32, 32, 24);
      gradient.addColorStop(0, "rgba(255,255,255,0)");
      gradient.addColorStop(0.5, "rgba(255,255,255,0.6)");
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = gradient;
      ctx.fill();
      return canvas;
    },
  ];

  for (const shapeFn of shapes) {
    const canvas = shapeFn();
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    textures.push(texture);
  }

  return textures;
}

function createBurstParticles(
  origin: THREE.Vector3,
  color: THREE.Color,
  burstShape: number,
): Particle[] {
  const particles: Particle[] = [];
  const count = 80 + Math.floor(Math.random() * 120);
  const baseSize = 0.18 + Math.random() * 0.12;

  switch (burstShape) {
    case 0: {
      for (let i = 0; i < count; i++) {
        const phi = Math.random() * Math.PI * 2;
        const theta = Math.acos(2 * Math.random() - 1);
        const speed = 0.8 + Math.random() * 1.5;
        particles.push({
          position: origin.clone(),
          velocity: new THREE.Vector3(
            Math.sin(theta) * Math.cos(phi) * speed,
            Math.sin(theta) * Math.sin(phi) * speed,
            Math.cos(theta) * speed * 0.3,
          ),
          color: color.clone(),
          life: 1,
          maxLife: 2.5 + Math.random() * 2,
          size: baseSize + Math.random() * 0.08,
          shape: Math.floor(Math.random() * 4),
          trail: [],
          trailLength: 3 + Math.floor(Math.random() * 4),
        });
      }
      break;
    }
    case 1: {
      const rings = 2 + Math.floor(Math.random() * 3);
      for (let r = 0; r < rings; r++) {
        const ringCount = Math.floor(count / rings);
        const ringSpeed = 0.8 + r * 0.6;
        const tilt = Math.random() * 0.3;
        for (let i = 0; i < ringCount; i++) {
          const angle = (i / ringCount) * Math.PI * 2;
          particles.push({
            position: origin.clone(),
            velocity: new THREE.Vector3(
              Math.cos(angle) * ringSpeed,
              Math.sin(angle) * ringSpeed + tilt,
              (Math.random() - 0.5) * 0.3,
            ),
            color: color.clone(),
            life: 1,
            maxLife: 2.5 + Math.random() * 1.5,
            size: baseSize + Math.random() * 0.06,
            shape: Math.floor(Math.random() * 4),
            trail: [],
            trailLength: 4,
          });
        }
      }
      break;
    }
    case 2: {
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const armAngle = angle + (Math.random() - 0.5) * 0.3;
        const speed = 0.5 + Math.random() * 1.5;
        const spread = Math.random() * 0.4;
        particles.push({
          position: origin.clone(),
          velocity: new THREE.Vector3(
            Math.cos(armAngle) * speed + (Math.random() - 0.5) * spread,
            Math.sin(armAngle) * speed + (Math.random() - 0.5) * spread,
            (Math.random() - 0.5) * 0.2,
          ),
          color: color.clone(),
          life: 1,
          maxLife: 2 + Math.random() * 2.5,
          size: baseSize + Math.random() * 0.1,
          shape: Math.floor(Math.random() * 4),
          trail: [],
          trailLength: 5,
        });
      }
      break;
    }
    case 3: {
      for (let i = 0; i < count; i++) {
        const speed = 1 + Math.random() * 1.2;
        const angle = Math.random() * Math.PI * 2;
        const upBias = 0.3 + Math.random() * 0.8;
        particles.push({
          position: origin.clone(),
          velocity: new THREE.Vector3(
            Math.cos(angle) * speed * (0.3 + Math.random() * 0.7),
            Math.abs(Math.sin(angle) * speed) + upBias,
            (Math.random() - 0.5) * 0.3,
          ),
          color: color.clone(),
          life: 1,
          maxLife: 3 + Math.random() * 2,
          size: baseSize + Math.random() * 0.06,
          shape: Math.floor(Math.random() * 4),
          trail: [],
          trailLength: 6 + Math.floor(Math.random() * 4),
        });
      }
      break;
    }
    default: {
      const arms = 5 + Math.floor(Math.random() * 4);
      for (let i = 0; i < count; i++) {
        const arm = i % arms;
        const armBaseAngle = (arm / arms) * Math.PI * 2;
        const offset = (Math.random() - 0.5) * 0.4;
        const speed = 0.8 + Math.random() * 1.2;
        particles.push({
          position: origin.clone(),
          velocity: new THREE.Vector3(
            Math.cos(armBaseAngle + offset) * speed,
            Math.sin(armBaseAngle + offset) * speed,
            (Math.random() - 0.5) * 0.2,
          ),
          color: color.clone(),
          life: 1,
          maxLife: 2 + Math.random() * 2,
          size: baseSize + Math.random() * 0.08,
          shape: Math.floor(Math.random() * 4),
          trail: [],
          trailLength: 3,
        });
      }
    }
  }

  return particles;
}

function createStars(count: number): THREE.Points {
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 80;
    positions[i * 3 + 1] = Math.random() * 30 + 5;
    positions[i * 3 + 2] = -20 - Math.random() * 30;
    sizes[i] = 0.02 + Math.random() * 0.06;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

  const starCanvas = document.createElement("canvas");
  starCanvas.width = 32;
  starCanvas.height = 32;
  const ctx = starCanvas.getContext("2d");
  if (!ctx) return new THREE.Points(geometry, new THREE.PointsMaterial());
  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.2, "rgba(200,220,255,0.8)");
  gradient.addColorStop(1, "rgba(200,220,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 32, 32);

  const material = new THREE.PointsMaterial({
    map: new THREE.CanvasTexture(starCanvas),
    size: 0.15,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  return new THREE.Points(geometry, material);
}

export default function FireworksScene() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020010);
    scene.fog = new THREE.FogExp2(0x020010, 0.015);

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      100,
    );
    camera.position.set(0, 2, 15);
    camera.lookAt(0, 8, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    containerRef.current.appendChild(renderer.domElement);

    const stars = createStars(600);
    scene.add(stars);

    const ambientLight = new THREE.AmbientLight(0x111133, 0.3);
    scene.add(ambientLight);

    const textures = createParticleTextures();

    const fireworks: Firework[] = [];
    let lastLaunch = 0;
    const launchInterval = 0.3 + Math.random() * 0.5 + 3;

    const particleSystems: THREE.Points[] = [];

    function launchFirework() {
      const color = randomColor();
      const launchType = Math.random();

      let startX: number;
      let velX: number;
      let velY: number;

      if (launchType < 0.3) {
        startX = -10 - Math.random() * 5;
        velX = 2 + Math.random() * 3;
        velY = 5 + Math.random() * 3;
      } else if (launchType < 0.6) {
        startX = 10 + Math.random() * 5;
        velX = -(2 + Math.random() * 3);
        velY = 5 + Math.random() * 3;
      } else {
        startX = (Math.random() - 0.5) * 12;
        velX = (Math.random() - 0.5) * 1.5;
        velY = 5 + Math.random() * 4;
      }

      const firework: Firework = {
        rocket: {
          position: new THREE.Vector3(startX, -2, (Math.random() - 0.5) * 4),
          velocity: new THREE.Vector3(velX, velY, 0),
          color,
          life: 1,
          exploded: false,
        },
        particles: [],
        burstShape: Math.floor(Math.random() * 5),
      };

      fireworks.push(firework);
    }

    const timer = new THREE.Timer();

    function animate() {
      timer.update();
      const delta = Math.min(timer.getDelta(), 0.005);
      const elapsed = timer.getElapsed();

      lastLaunch += delta;
      if (lastLaunch > launchInterval) {
        const burstThreshold = Math.max(
          0,
          1 - Math.max(0, elapsed - 120) / 360,
        );
        const burstCount =
          Math.random() > burstThreshold
            ? 2 + Math.floor(Math.random() * 3)
            : 1;
        for (let i = 0; i < burstCount; i++) {
          setTimeout(() => launchFirework(), i * 100);
        }
        lastLaunch = -(0.3 + Math.random() * 1.2);
      }

      for (const ps of particleSystems) {
        scene.remove(ps);
        ps.geometry.dispose();
        if (ps.material instanceof THREE.Material) ps.material.dispose();
      }
      particleSystems.length = 0;

      for (let fi = fireworks.length - 1; fi >= 0; fi--) {
        const fw = fireworks[fi];

        if (!fw.rocket.exploded) {
          fw.rocket.velocity.y -= 0.5 * delta;
          fw.rocket.position.add(
            fw.rocket.velocity.clone().multiplyScalar(delta),
          );

          if (fw.rocket.velocity.y <= 0 || fw.rocket.life <= 0) {
            fw.rocket.exploded = true;
            fw.particles = createBurstParticles(
              fw.rocket.position,
              fw.rocket.color,
              fw.burstShape,
            );
          }

          fw.rocket.life -= delta * 0.5;

          const rocketGeo = new THREE.BufferGeometry();
          rocketGeo.setAttribute(
            "position",
            new THREE.BufferAttribute(
              new Float32Array([
                fw.rocket.position.x,
                fw.rocket.position.y,
                fw.rocket.position.z,
              ]),
              3,
            ),
          );
          const rocketMat = new THREE.PointsMaterial({
            color: fw.rocket.color,
            size: 0.2,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            map: textures[0],
          });
          const rocketPoint = new THREE.Points(rocketGeo, rocketMat);
          scene.add(rocketPoint);
          particleSystems.push(rocketPoint);
        }

        let allDead = true;
        const gravity = new THREE.Vector3(0, -1.2, 0);

        for (let pi = fw.particles.length - 1; pi >= 0; pi--) {
          const p = fw.particles[pi];
          p.life -= delta / p.maxLife;

          if (p.life <= 0) {
            fw.particles.splice(pi, 1);
            continue;
          }

          allDead = false;

          p.trail.push(p.position.clone());
          if (p.trail.length > p.trailLength) p.trail.shift();

          p.velocity.add(gravity.clone().multiplyScalar(delta));
          p.velocity.multiplyScalar(1 - delta * 0.4);
          p.position.add(p.velocity.clone().multiplyScalar(delta));
        }

        if (fw.rocket.exploded && fw.particles.length > 0) {
          const totalPoints = fw.particles.reduce(
            (sum, p) => sum + 1 + p.trail.length,
            0,
          );
          const positions = new Float32Array(totalPoints * 3);
          const colors = new Float32Array(totalPoints * 3);
          const sizes = new Float32Array(totalPoints);

          let idx = 0;
          for (const p of fw.particles) {
            for (let ti = 0; ti < p.trail.length; ti++) {
              const t = p.trail[ti];
              const trailFade = (ti + 1) / p.trail.length;
              positions[idx * 3] = t.x;
              positions[idx * 3 + 1] = t.y;
              positions[idx * 3 + 2] = t.z;
              colors[idx * 3] = p.color.r * trailFade * p.life;
              colors[idx * 3 + 1] = p.color.g * trailFade * p.life;
              colors[idx * 3 + 2] = p.color.b * trailFade * p.life;
              sizes[idx] = p.size * trailFade * 0.5;
              idx++;
            }

            positions[idx * 3] = p.position.x;
            positions[idx * 3 + 1] = p.position.y;
            positions[idx * 3 + 2] = p.position.z;
            colors[idx * 3] = p.color.r * p.life;
            colors[idx * 3 + 1] = p.color.g * p.life;
            colors[idx * 3 + 2] = p.color.b * p.life;
            sizes[idx] = p.size * (0.5 + p.life * 0.5);
            idx++;
          }

          const geo = new THREE.BufferGeometry();
          geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
          geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
          geo.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

          const shapeIdx = fw.burstShape % textures.length;
          const mat = new THREE.PointsMaterial({
            size: 0.35,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            vertexColors: true,
            map: textures[shapeIdx],
            sizeAttenuation: true,
          });

          const points = new THREE.Points(geo, mat);
          scene.add(points);
          particleSystems.push(points);
        }

        if (fw.rocket.exploded && (allDead || fw.particles.length === 0)) {
          fireworks.splice(fi, 1);
        }
      }

      const starPositions = stars.geometry.attributes.position;
      for (let i = 0; i < starPositions.count; i++) {
        starPositions.setY(
          i,
          starPositions.getY(i) + Math.sin(elapsed * 0.1 + i) * 0.0005,
        );
      }
      starPositions.needsUpdate = true;

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }

    animate();

    function handleResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      for (const t of textures) t.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: "100vw", height: "100vh", overflow: "hidden" }}
    />
  );
}
