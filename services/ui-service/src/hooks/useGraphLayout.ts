import { useCallback } from 'react';
import { Core, LayoutOptions } from 'cytoscape';

type LayoutType = 'force' | 'hierarchical' | 'circular';

const layoutConfigs: Record<LayoutType, LayoutOptions> = {
  force: {
    name: 'cose',
    animate: true,
    animationDuration: 500,
    nodeRepulsion: 4500,
    idealEdgeLength: 100,
    edgeElasticity: 0.45,
    numIter: 1000,
    randomize: false,
    componentSpacing: 100,
    padding: 30,
  },
  hierarchical: {
    name: 'dagre',
    rankDir: 'TB',
    align: 'UL',
    ranker: 'network-simplex',
    spacingFactor: 1.2,
    nodeDimensionsIncludeLabels: true,
    animate: true,
    animationDuration: 500,
    padding: 30,
  },
  circular: {
    name: 'circle',
    animate: true,
    animationDuration: 500,
    padding: 30,
    spacingFactor: 1.2,
    radius: undefined,
    startAngle: 3 / 2 * Math.PI,
    sweep: undefined,
    clockwise: true,
  },
};

export const useGraphLayout = () => {
  const applyLayout = useCallback((cy: Core, layoutType: LayoutType) => {
    const layout = cy.layout(layoutConfigs[layoutType]);
    layout.run();

    return () => {
      layout.stop();
    };
  }, []);

  return {
    applyLayout,
  };
};
