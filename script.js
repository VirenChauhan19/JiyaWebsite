const navLinks = document.querySelector(".nav-links");
const menuButton = document.querySelector(".menu-toggle");

if (menuButton && navLinks) {
  menuButton.addEventListener("click", () => {
    navLinks.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", navLinks.classList.contains("open"));
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      menuButton.setAttribute("aria-expanded", "false");
    });
  });
}

const currentPage = document.body.dataset.page;

document.querySelectorAll("[data-nav]").forEach((link) => {
  if (link.dataset.nav === currentPage) {
    link.classList.add("active");
  }
});

const lightbox = document.querySelector(".lightbox");
const lightboxImage = document.querySelector(".lightbox img");
const lightboxClose = document.querySelector(".lightbox button");

document.querySelectorAll("[data-lightbox]").forEach((image) => {
  image.addEventListener("click", () => {
    if (!lightbox || !lightboxImage) return;
    lightboxImage.src = image.currentSrc || image.src;
    lightboxImage.alt = image.alt;
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
  });
});

if (lightboxClose) {
  lightboxClose.addEventListener("click", () => {
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
  });
}

if (lightbox) {
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) {
      lightbox.classList.remove("open");
      lightbox.setAttribute("aria-hidden", "true");
    }
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && lightbox?.classList.contains("open")) {
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
  }
});

const videoPlayers = document.querySelectorAll("video[data-hls-src]");

const loadExternalScript = (src) =>
  new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      existing.addEventListener("load", resolve, { once: true });
      if (window.Hls) resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });

const initializeVideos = async () => {
  if (!videoPlayers.length) return;

  const hlsVideos = [];

  const prepareVideo = (video) => {
    video.muted = true;
    video.defaultMuted = true;
    video.loop = true;
    video.autoplay = true;
    video.controls = false;
    video.playsInline = true;
  };

  const playVideo = (video) => {
    const playPromise = video.play();
    if (playPromise) {
      playPromise.catch(() => {});
    }
  };

  videoPlayers.forEach((video) => {
    const src = video.dataset.hlsSrc;
    prepareVideo(video);

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      video.addEventListener("loadedmetadata", () => playVideo(video), { once: true });
      playVideo(video);
    } else {
      hlsVideos.push({ video, src });
    }
  });

  if (!hlsVideos.length) return;

  try {
    await loadExternalScript("https://cdn.jsdelivr.net/npm/hls.js@1/dist/hls.min.js");
  } catch (error) {
    hlsVideos.forEach(({ video, src }) => {
      video.src = src;
      video.addEventListener("loadedmetadata", () => playVideo(video), { once: true });
      playVideo(video);
    });
    return;
  }

  if (!window.Hls || !window.Hls.isSupported()) return;

  hlsVideos.forEach(({ video, src }) => {
    const hls = new window.Hls({ enableWorker: true });
    hls.loadSource(src);
    hls.attachMedia(video);
    hls.on(window.Hls.Events.MANIFEST_PARSED, () => playVideo(video));
  });
};

initializeVideos();

const initializeLuxuryDepth = async () => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  let THREE;
  try {
    THREE = await import("https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js");
  } catch (error) {
    return;
  }

  const canvas = document.createElement("canvas");
  canvas.className = "luxury-depth-canvas";
  canvas.setAttribute("aria-hidden", "true");
  document.body.prepend(canvas);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 8);

  const group = new THREE.Group();
  scene.add(group);

  const ribbonMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xd5b36b,
    roughness: 0.32,
    metalness: 0.56,
    clearcoat: 0.8,
    transparent: true,
    opacity: 0.28
  });

  const roseMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xb94a78,
    roughness: 0.42,
    metalness: 0.22,
    clearcoat: 0.62,
    transparent: true,
    opacity: 0.16
  });

  const sageMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x576a5c,
    roughness: 0.46,
    metalness: 0.18,
    transparent: true,
    opacity: 0.14
  });

  const shapes = [
    { geometry: new THREE.TorusKnotGeometry(1.45, 0.038, 220, 14, 2, 5), material: ribbonMaterial, position: [-3.4, 1.2, -1.2], scale: 1.4 },
    { geometry: new THREE.TorusKnotGeometry(1.1, 0.032, 180, 12, 3, 4), material: roseMaterial, position: [3.2, -0.6, -0.8], scale: 1.55 },
    { geometry: new THREE.TorusGeometry(1.9, 0.024, 12, 220), material: sageMaterial, position: [1.2, 2.3, -1.5], scale: 1.2 },
    { geometry: new THREE.TorusGeometry(2.15, 0.02, 12, 220), material: ribbonMaterial, position: [-1.1, -2.2, -1.7], scale: 1.05 }
  ];

  shapes.forEach((item, index) => {
    const mesh = new THREE.Mesh(item.geometry, item.material);
    mesh.position.set(...item.position);
    mesh.scale.setScalar(item.scale);
    mesh.rotation.set(index * 0.6, index * 0.34, index * 0.2);
    group.add(mesh);
  });

  const lightA = new THREE.DirectionalLight(0xfffaf2, 2.6);
  lightA.position.set(2, 4, 5);
  scene.add(lightA);

  const lightB = new THREE.PointLight(0xffd7eb, 1.5, 16);
  lightB.position.set(-4, -2, 4);
  scene.add(lightB);

  const resize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };

  let scrollTarget = 0;
  let scrollValue = 0;

  const updateScroll = () => {
    const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    scrollTarget = window.scrollY / maxScroll;
  };

  const animate = (time) => {
    scrollValue += (scrollTarget - scrollValue) * 0.08;
    group.rotation.y = scrollValue * Math.PI * 1.35 + time * 0.00007;
    group.rotation.x = -0.24 + scrollValue * 0.44;
    group.position.y = 0.6 - scrollValue * 1.35;

    group.children.forEach((mesh, index) => {
      mesh.rotation.z += 0.0015 + index * 0.00035;
      mesh.rotation.x += 0.0007;
    });

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  };

  window.addEventListener("resize", resize);
  window.addEventListener("scroll", updateScroll, { passive: true });
  resize();
  updateScroll();
  requestAnimationFrame(animate);
};

initializeLuxuryDepth();
