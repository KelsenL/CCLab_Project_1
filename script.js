class Antenna {
    constructor(x, y, routerX, routerY) {
        // 底座
        this.baseX = x;
        this.baseY = y;
        this.baseWidth = 20;
        this.baseHeight = 10;
        
        // 触点
        this.contactRadius = 5;
        this.contactX = routerX;
        this.contactY = routerY;
        
        // 电线
        this.wireStartX = this.baseX + this.baseWidth / 2;
        this.wireStartY = this.baseY;
        this.wireEndX = this.contactX;
        this.wireEndY = this.contactY;
        
        this.isAttached = true;
        this.isAnimating = false;
    }

    draw() {
        // 绘制底座
        fill('gray');
        rect(this.baseX, this.baseY, this.baseWidth, this.baseHeight);
        
        // 绘制电线
        stroke('black');
        line(this.wireStartX, this.wireStartY, this.wireEndX, this.wireEndY);
        
        // 绘制触点
        fill(this.isAttached ? 'green' : 'red');
        ellipse(this.wireEndX, this.wireEndY, this.contactRadius * 2);
    }

    attach() {
        if (this.isAnimating) return;
        this.isAnimating = true;
        
        const targetX = this.isAttached ? this.baseX + this.baseWidth / 2 : this.contactX;
        const targetY = this.isAttached ? this.baseY : this.contactY;
        
        const animate = () => {
            const dx = targetX - this.wireEndX;
            const dy = targetY - this.wireEndY;
            const distance = dist(this.wireEndX, this.wireEndY, targetX, targetY);
            
            if (distance > 1) {
                this.wireEndX += dx * 0.1;
                this.wireEndY += dy * 0.1;
            } else {
                this.wireEndX = targetX;
                this.wireEndY = targetY;
                this.isAttached = !this.isAttached;
                this.isAnimating = false;
            }
        };
        
        const animationInterval = setInterval(() => {
            animate();
            if (!this.isAnimating) {
                clearInterval(animationInterval);
            }
        }, 16); // 约60fps
    }

    isPointInside(x, y) {
        return dist(x, y, this.wireEndX, this.wireEndY) <= this.contactRadius;
    }
}

// 全局变量
let antenna;

function setup() {
    createCanvas(500, 300);
    antenna = new Antenna(10, 150, 400, 150);
}

function draw() {
    background(220);
    antenna.draw();
}

function mouseClicked() {
    if (antenna.isPointInside(mouseX, mouseY)) {
        antenna.attach();
    }
}
