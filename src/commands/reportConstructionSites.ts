export function rcs(): void {
  const css = Object.values(Game.constructionSites);
  const report = css.reduce(
    (acc, cur) => {
      acc.amount += 1;
      acc.hitsToBuild += cur.progressTotal - cur.progress;
      acc[cur.structureType] = acc[cur.structureType] ? acc[cur.structureType] + 1 : 1;
      return acc;
    },
    { amount: 0, hitsToBuild: 0 } as { amount: number; hitsToBuild: number; [structureType: string]: number }
  );
  console.log(`Construction sites report:`, JSON.stringify(report, null, 2));
}
