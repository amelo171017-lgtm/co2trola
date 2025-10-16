class CanvasBackground {
    constructor() {
        this.canvas = document.getElementById('backgroundCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.img = new Image();
        this.img.src = './assets/background.png';
        
        this.init();
    }

    init() {
        this.resizeCanvas();
        
        this.img.onload = () => {
            this.drawBackground();
        };
        
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.drawBackground();
        });

        if (this.img.complete) {
            this.drawBackground();
        }
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    drawBackground() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = "high";

        const aspectCanvas = this.canvas.width / this.canvas.height;
        const aspectImage = this.img.width / this.img.height;

        let drawWidth, drawHeight, offsetX, offsetY;

        if (aspectCanvas > aspectImage) {
            drawWidth = this.canvas.width;
            drawHeight = this.canvas.width / aspectImage;
            offsetX = 0;
            offsetY = (this.canvas.height - drawHeight) / 2;
        } else {
            drawHeight = this.canvas.height;
            drawWidth = this.canvas.height * aspectImage;
            offsetY = 0;
            offsetX = (this.canvas.width - drawWidth) / 2;
        }

        this.ctx.drawImage(this.img, offsetX, offsetY, drawWidth, drawHeight);

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    updateBasedOnAirQuality(aqi) {
        this.drawBackground();
        
        if (aqi > 60) {
            this.ctx.fillStyle = 'rgba(231, 76, 60, 0.1)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        } else if (aqi > 40) {
            this.ctx.fillStyle = 'rgba(241, 196, 15, 0.1)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        } else {
            this.ctx.fillStyle = 'rgba(0, 212, 170, 0.1)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.canvasBackground = new CanvasBackground();
});