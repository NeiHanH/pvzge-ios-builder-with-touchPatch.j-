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

/* ============================================================
 * 新增：单指滑动追踪
 * 用于判断本次触摸是否为「单指拖动」，并在拖动结束后
 * 在手指离开的位置补发一次左键 mousedown + mouseup，
 * 使游戏内植物放置等依赖鼠标点击的操作能够正常触发。
 * ============================================================ */
let singleStartX = 0;
let singleStartY = 0;
let singleMoved = false;          // 单指是否发生了滑动
const SINGLE_MOVE_THRESHOLD = 5;  // 滑动判定阈值（像素）
/* ============================================================ */

document.addEventListener("touchstart", (event) => {
    /* ---------- 新增：记录单指起点，重置滑动标记 ---------- */
    if (event.touches.length === 1) {
        singleStartX = event.touches[0].clientX;
        singleStartY = event.touches[0].clientY;
        singleMoved = false;
    } else {
        // 多指操作不参与单指滑动判定
        singleMoved = false;
    }
    /* ------------------------------------------------------ */

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
    /* ---------- 新增：单指滑动判定 ---------- */
    if (event.touches.length === 1 && !singleMoved) {
        const dx = event.touches[0].clientX - singleStartX;
        const dy = event.touches[0].clientY - singleStartY;
        if (dx * dx + dy * dy > SINGLE_MOVE_THRESHOLD * SINGLE_MOVE_THRESHOLD) {
            singleMoved = true;
        }
    }
    // 多指出现时，取消单指滑动状态
    if (event.touches.length > 1) {
        singleMoved = false;
    }
    /* ------------------------------------------ */

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

    /* ---------- 新增：保存本次是否为「单指滑动结束」及松手点信息 ---------- */
    const wasSingleSwipe = singleMoved && event.changedTouches.length === 1;
    const endTouch = event.changedTouches[0];
    const endTarget = endTouch.target;
    /* -------------------------------------------------------------------- */

    setTimeout(() => {
        event.changedTouches[0].target.dispatchEvent(createEvent(event, "mouseup"));
    }, delay_time);

    /* ============================================================
     * 新增：单指滑动结束后，在手指离开的位置补发一次左键点击
     * 事件流：mousedown → (10ms) → mouseup
     * 坐标使用手指离开时的 clientX/clientY，
     * 游戏会自行判断该点位是否存在可交互元素。
     * ============================================================ */
    if (wasSingleSwipe && endTouch) {
        setTimeout(() => {
            const md = new MouseEvent("mousedown", {
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
            endTarget.dispatchEvent(md);

            setTimeout(() => {
                const mu = new MouseEvent("mouseup", {
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
                endTarget.dispatchEvent(mu);
            }, 10);
        }, delay_time * 2);
    }
    /* ============================================================ */

    /* ---------- 新增：重置单指滑动状态 ---------- */
    singleMoved = false;
    /* ------------------------------------------ */

    event.preventDefault();
    event.stopPropagation();
}, true);
