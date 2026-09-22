function createEvent(event, type, button) {
    let touches = event.changedTouches,
        first = touches[0];
    return new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        view: window,
        detail: 1,
        screenX: first.screenX,
        screenY: first.screenY,
        clientX: first.clientX,
        clientY: first.clientY,
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        metaKey: false,
        button: button || 0,
        relatedTarget: null
    });
}

let delay_time = 16;
let lastY = null;

// 记录本次触摸过程中是否出现过双指/三指，避免多指操作后误触发单指 click
let wasMultiTouch = false;

document.addEventListener("touchstart", (event) => {
    if (event.touches.length >= 2) {
        wasMultiTouch = true;
    }

    if (event.touches.length === 3) {
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        const touch3 = event.touches[2];
        setTimeout(() => {
            event.changedTouches[0].target.dispatchEvent(createEvent(event, "mousedown", 2));
        }, delay_time);
        setTimeout(() => {
            event.changedTouches[0].target.dispatchEvent(createEvent(event, "mouseup", 2));
        }, delay_time * 2);
    }

    if (event.touches.length === 2) {
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        lastY = (touch1.clientY + touch2.clientY) / 2;
    }

    event.changedTouches[0].target.dispatchEvent(createEvent(event, "mousemove"));
    setTimeout(() => {
        event.changedTouches[0].target.dispatchEvent(createEvent(event, "mousedown"));
    }, delay_time);
    event.preventDefault();
    event.stopPropagation();
}, true);

document.addEventListener("touchmove", (event) => {
    if (event.touches.length === 2) {
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        const currentY = (touch1.clientY + touch2.clientY) / 2;

        if (lastY !== null) {
            const deltaY = currentY - lastY;
            const wheelDelta = deltaY * -3;

            const wheelEvent = new WheelEvent('wheel', {
                deltaY: wheelDelta,
                deltaMode: 0,
                bubbles: true,
                screenX: (touch1.screenX + touch2.screenX) / 2,
                screenY: (touch1.screenY + touch2.screenY) / 2,
                clientX: (touch1.clientX + touch2.clientX) / 2,
                clientY: currentY,
                relatedTarget: null
            });
            document.getElementById("GameCanvas").dispatchEvent(wheelEvent);
        }
        lastY = currentY;
    }

    setTimeout(() => {
        event.changedTouches[0].target.dispatchEvent(createEvent(event, "mousemove"));
    }, delay_time);
    event.preventDefault();
    event.stopPropagation();
}, true);

document.addEventListener("touchend", (event) => {
    lastY = null;

    const endTouch = event.changedTouches[0];

    // 先派发 mouseup
    setTimeout(() => {
        event.changedTouches[0].target.dispatchEvent(createEvent(event, "mouseup"));
    }, delay_time);

    // 单指触摸结束 → 在松开点派发 click
    // 拖拽后松手放置植物、点击卡片/草坪放置植物，都依赖这一次 click
    const isSingleTouchEnd = !wasMultiTouch && event.changedTouches.length === 1;
    if (isSingleTouchEnd && endTouch) {
        setTimeout(() => {
            const clickEvent = new MouseEvent("click", {
                bubbles: true,
                cancelable: true,
                view: window,
                detail: 1,
                screenX: endTouch.screenX,
                screenY: endTouch.screenY,
                clientX: endTouch.clientX,
                clientY: endTouch.clientY,
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                metaKey: false,
                button: 0,
                relatedTarget: null
            });
            endTouch.target.dispatchEvent(clickEvent);
        }, delay_time * 2);
    }

    // 所有手指离开屏幕后，重置多指标记
    if (event.touches.length === 0) {
        wasMultiTouch = false;
    }

    event.preventDefault();
    event.stopPropagation();
}, true);
