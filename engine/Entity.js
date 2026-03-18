export class Entity {
  constructor(x = 0, y = 0, spriteKey = null) {
    this.x = x;
    this.y = y;

    this.vx = 0;
    this.vy = 0;

    this.width = 1;
    this.height = 1;

    this.solid = false;
    this.tags = new Set();

    this.spriteKey = spriteKey;
    this.sprite = null; // Phaser sprite reference
  }

  /** Wird von der Engine beim Registrieren ausgeführt */
  initSprite(scene, world) {
    if (!this.spriteKey) return;

    const t = world.tile;

    this.sprite = scene.add.sprite(
      this.x * t + t/2,
      this.y * t + t/2,
      this.spriteKey
    );

    this.sprite.setOrigin(0.5);

    const w = this.sprite.width;
    const h = this.sprite.height;

    const scale = Math.min(t / w, t / h);
    this.sprite.setScale(scale);

  }

  /** Standard-Move (dx,dy) in Tiles */
  move(dx, dy, world) {
    const nx = this.x + dx;
    const ny = this.y + dy;

    if (world.inBounds(nx, ny)) {
      this.x = nx;
      this.y = ny;
    }
  }

  setSprite(key) {
    if (!this.sprite) return;
    if (this.sprite.texture.key === key) return; // kein unnötiges Umschalten

    this.spriteKey = key;
    this.sprite.setTexture(key);
  }

  /** Update Logik (dt in Sekunden) */
  update(dt, engine) {
    // Tile-unabhängige Bewegung falls velocity gesetzt ist
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  getAABB() {
    return { x: this.x, y: this.y, w: this.width, h: this.height };
  }

  /** Renderer ruft das auf, um Sprite-Position zu aktualisieren */
  syncSprite(world) {
    if (!this.sprite) return;
    const t = world.tile;
    this.sprite.x = this.x * t + t/2;
    this.sprite.y = this.y * t + t/2;
  }
}