export type BuildingGraph = {
	[parentDep: string]: Set<string>
}

export default BuildingGraph;
