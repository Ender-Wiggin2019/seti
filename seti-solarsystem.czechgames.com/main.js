let clicks = 0;
function randomizeWheels() {
  document.querySelector('button').classList.remove('pulsin');
  ++clicks;
  document.querySelector('.wheel-wrap').style.opacity = 1;
  for (let w of [1, 2, 3, 4]) {
    let oldRotation = document
      .querySelector('.wheel' + w)
      .getAttribute('currRotation');
    let newRotation =
      +oldRotation - Math.floor(Math.random() * 8 + [0, 20, 11, 7, 4][w]);
    let rotation = (newRotation * Math.PI) / 4;
    let targetStyle = `rotate(${rotation}rad)`;
    let wheels = document.querySelectorAll('.wheel' + w);
    for (let targetEl of wheels) {
      let duration = 800 * (6 - w);
      let oldRotation = targetEl.getAttribute('currRotation');
      let startStyle = `rotate(${(oldRotation * Math.PI) / 4}rad)`;
      targetEl.setAttribute('currRotation', newRotation);
      targetEl.animate(
        [
          oldRotation ? { transform: startStyle } : {},
          { transform: targetStyle },
        ],
        {
          duration,
          iterations: 1,
          fill: 'both',
          easing: 'ease-out',
          delay: targetEl.getAttribute('delay'),
        },
      );
      setTimeout(() => {
        targetEl.style.animation = 'unset';
      }, duration);
    }
  }
  document
    .querySelector('.connector')
    .animate(
      [
        { filter: 'brightness(1)' },
        { filter: 'brightness(3)' },
        { filter: 'brightness(1)' },
      ],
      { duration: 1000 },
    );
  document
    .querySelector('button')
    .animate(
      [
        { filter: 'brightness(1)' },
        { filter: 'brightness(1.5)' },
        { filter: 'brightness(1)' },
      ],
      { duration: 500 },
    );
  randomizeSectors();
}

function randomizeSectors() {
  for (let w of [1, 2, 3]) {
    let flyWrapEl = document.querySelector('.fly-wrap-' + w);
    let randomSectors = [1, 2, 3, 4];
    let wrap = document.querySelector('.wheel-wrap');
    while (randomSectors.length) {
      let targetWrap = document.getElementById(
        'sector-wrap-' + randomSectors.length,
      );
      targetWrap.innerHTML = '';
      let randomSector = randomSectors.splice(
        Math.floor(Math.random() * randomSectors.length),
        1,
      )[0];
      let newSector = document.createElement('div');
      newSector.classList.add('sector-' + randomSector, 'sector');
      let label = document.createElement('div');
      label.classList.add('sector-label', 'sector-label-' + randomSector);
      newSector.appendChild(label);
      targetWrap.appendChild(newSector);
    }
  }
}

function main() {
  resize();
  initWheels();
  //randomizeSectors()
  document
    .querySelector('.spin-button')
    .addEventListener('click', randomizeWheels);
}

function initWheels() {
  let wrap = document.querySelector('.wheel-wrap');
  for (let wheel of [1, 2, 3, 4]) {
    let wheelWrap = document.createElement('div');
    wheelWrap.classList.add('fly-wrap', 'fly-wrap-' + wheel);
    for (let [opacity, delay] of [
      [0.5, 180],
      [0.6, 140],
      [0.7, 100],
      [0.75, 75],
      [0.8, 50],
      [0.85, 35],
      [0.9, 20],
      [0.95, 10],
      [1, 0],
    ]) {
      let newWheel = document.createElement('div');
      newWheel.style.opacity = opacity;
      newWheel.setAttribute('delay', delay);
      newWheel.classList.add('wheel', 'wheel' + wheel);
      if (opacity < 1) {
        newWheel.classList.add('wheel-blur');
      }
      wheelWrap.appendChild(newWheel);
      wrap.appendChild(wheelWrap);
    }
  }
  for (let sector of [1, 2, 3, 4]) {
    let sectorWrap = document.createElement('div');
    sectorWrap.classList.add('sector-wrap');
    sectorWrap.id = 'sector-wrap-' + sector;
    wrap.appendChild(sectorWrap);
  }
  let sun = document.createElement('div');
  sun.classList.add('sun');
  wrap.appendChild(sun);
}

function resize() {
  let w = window.innerWidth;
  let h = window.innerHeight;
  let targetW = w;
  let cutoff = 0.5;
  if (w / h > cutoff) {
    targetW = h * cutoff;
  }
  document.querySelector('.app-wrap').style.width = targetW + 'px';
}

console.log('test');

window.onresize = resize;
onload = main();
