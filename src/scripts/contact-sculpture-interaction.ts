export type ContactSculpturePoint = [number, number];

type ContactSculptureInteractionState = {
  pointer: ContactSculpturePoint;
  pointerStrength: number;
  pointerTarget: ContactSculpturePoint;
  pointerTargetStrength: number;
  pressed: boolean;
  rippleAge: number;
  rippleEnergy: number;
  rippleOrigin: ContactSculpturePoint;
};

export class ContactSculptureInteraction {
  private readonly state: ContactSculptureInteractionState = {
    pointer: [0.5, 0.5],
    pointerStrength: 0,
    pointerTarget: [0.5, 0.5],
    pointerTargetStrength: 0,
    pressed: false,
    rippleAge: 100,
    rippleEnergy: 0,
    rippleOrigin: [0.5, 0.5],
  };

  advance(frameDuration: number) {
    const pointerEase = 1 - Math.exp(-frameDuration / 85);
    const strengthEase = 1 - Math.exp(-frameDuration / 150);
    this.state.pointer[0] += (this.state.pointerTarget[0] - this.state.pointer[0]) * pointerEase;
    this.state.pointer[1] += (this.state.pointerTarget[1] - this.state.pointer[1]) * pointerEase;
    this.state.pointerStrength +=
      (this.state.pointerTargetStrength - this.state.pointerStrength) * strengthEase;
    this.state.rippleAge += frameDuration / 1000;
    this.state.rippleEnergy *= Math.exp(-frameDuration / 1450);
    return this.state;
  }

  cancelPress() {
    this.state.pressed = false;
    this.state.pointerTargetStrength = 0;
  }

  hover(point: ContactSculpturePoint) {
    this.state.pointerTarget = point;
    this.state.pointerTargetStrength = this.state.pressed ? 1.65 : 1;
  }

  leave() {
    this.state.pointerTargetStrength = 0;
  }

  press(point: ContactSculpturePoint) {
    this.state.pressed = true;
    this.state.pointerTarget = point;
    this.state.pointerTargetStrength = 1.65;
  }

  release(point: ContactSculpturePoint) {
    this.state.pressed = false;
    this.state.pointerTarget = point;
    this.state.pointerTargetStrength = 1;
    this.state.rippleOrigin = point;
    this.state.rippleAge = 0;
    this.state.rippleEnergy = Math.min(this.state.rippleEnergy * 0.52 + 0.62, 1);
  }

  snapshot(): ContactSculptureInteractionState {
    return {
      ...this.state,
      pointer: [...this.state.pointer],
      pointerTarget: [...this.state.pointerTarget],
      rippleOrigin: [...this.state.rippleOrigin],
    };
  }
}

type ContactSculptureInputTarget = {
  cancelPress: () => void;
  clearPointer: () => void;
  press: (point: ContactSculpturePoint) => void;
  release: (point: ContactSculpturePoint) => void;
  setPointer: (point: ContactSculpturePoint) => void;
};

export const attachContactSculptureInteraction = (
  root: HTMLElement,
  interactionArea: HTMLElement,
  target: ContactSculptureInputTarget,
) => {
  const controller = new AbortController();
  const clickMoveTolerance = 8;
  let pressClientPoint: ContactSculpturePoint | undefined;
  let pressedPoint: ContactSculpturePoint | undefined;

  const pointWithinSculpture = (event: PointerEvent) => {
    const bounds = root.getBoundingClientRect();
    if (
      bounds.width <= 0 ||
      bounds.height <= 0 ||
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    ) {
      return;
    }
    return [
      (event.clientX - bounds.left) / bounds.width,
      1 - (event.clientY - bounds.top) / bounds.height,
    ] as ContactSculpturePoint;
  };

  const setInputState = (state: 'hover' | 'idle' | 'pressed' | 'released') => {
    root.dataset.contactSculptureInput = state;
  };

  const handlePointerMove = (event: PointerEvent) => {
    if (event.pointerType === 'touch') return;
    const point = pointWithinSculpture(event);
    if (
      pressClientPoint &&
      Math.hypot(event.clientX - pressClientPoint[0], event.clientY - pressClientPoint[1]) >
        clickMoveTolerance
    ) {
      pressClientPoint = undefined;
      pressedPoint = undefined;
      target.cancelPress();
    }
    if (point) {
      if (!pressedPoint) target.setPointer(point);
      setInputState(pressedPoint ? 'pressed' : 'hover');
    } else {
      target.clearPointer();
      setInputState('idle');
    }
  };
  const handlePointerDown = (event: PointerEvent) => {
    if (event.button !== 0 || event.pointerType === 'touch') return;
    const point = pointWithinSculpture(event);
    if (!point) return;
    pressClientPoint = [event.clientX, event.clientY];
    pressedPoint = point;
    target.press(point);
    setInputState('pressed');
  };
  const handlePointerUp = (event: PointerEvent) => {
    if (event.pointerType === 'touch' || !pressedPoint) return;
    const releaseOrigin = pressedPoint;
    pressClientPoint = undefined;
    pressedPoint = undefined;
    if (pointWithinSculpture(event)) {
      target.release(releaseOrigin);
      setInputState('released');
    } else {
      target.cancelPress();
      setInputState('idle');
    }
  };
  const handlePointerCancel = () => {
    pressClientPoint = undefined;
    pressedPoint = undefined;
    target.cancelPress();
    setInputState('idle');
  };
  const handlePointerLeave = () => {
    pressClientPoint = undefined;
    pressedPoint = undefined;
    target.cancelPress();
    target.clearPointer();
    setInputState('idle');
  };

  const { signal } = controller;
  root.dataset.contactSculptureInteractive = 'true';
  setInputState('idle');
  interactionArea.addEventListener('pointerdown', handlePointerDown, { passive: true, signal });
  interactionArea.addEventListener('pointermove', handlePointerMove, { passive: true, signal });
  interactionArea.addEventListener('pointerleave', handlePointerLeave, { passive: true, signal });
  window.addEventListener('pointerup', handlePointerUp, { passive: true, signal });
  window.addEventListener('pointercancel', handlePointerCancel, { passive: true, signal });

  return () => {
    controller.abort();
    pressClientPoint = undefined;
    pressedPoint = undefined;
    target.cancelPress();
    target.clearPointer();
    delete root.dataset.contactSculptureInput;
    delete root.dataset.contactSculptureInteractive;
  };
};
