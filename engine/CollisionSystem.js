export class CollisionSystem {

  static checkCollision(a, b) {
    const A = a.getAABB();
    const B = b.getAABB();

    return (
      A.x < B.x + B.w &&
      A.x + A.w > B.x &&
      A.y < B.y + B.h &&
      A.y + A.h > B.y
    );
  }

  static getCollisions(entity, allEntities) {
    const hits = [];

    for (const other of allEntities) {
      if (other === entity) continue;
      if (this.checkCollision(entity, other)) {
        hits.push(other);
      }
    }

    return hits;
  }
}