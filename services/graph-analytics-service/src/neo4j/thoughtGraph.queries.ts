/**
 * Neo4j Cypher queries for ThoughtGraph operations
 */

export const ThoughtGraphQueries = {
  // Node Operations
  CREATE_THOUGHT: `
    CREATE (t:Thought {
      id: $id,
      content: $content,
      type: $type,
      status: $status,
      metadata: $metadata
    })
    RETURN t
  `,

  GET_THOUGHT: `
    MATCH (t:Thought {id: $id})
    RETURN t
  `,

  UPDATE_THOUGHT: `
    MATCH (t:Thought {id: $id})
    SET t.content = $content,
        t.status = $status,
        t.metadata = $metadata
    RETURN t
  `,

  // Relationship Operations
  CREATE_REVISION: `
    MATCH (original:Thought {id: $originalId})
    MATCH (revision:Thought {id: $revisionId})
    CREATE (revision)-[:REVISES {
      timestamp: datetime(),
      reason: $reason
    }]->(original)
    RETURN revision, original
  `,

  CREATE_BRANCH: `
    MATCH (parent:Thought {id: $parentId})
    MATCH (branch:Thought {id: $branchId})
    CREATE (branch)-[:BRANCHES_FROM {
      timestamp: datetime(),
      metadata: $metadata
    }]->(parent)
    RETURN branch, parent
  `,

  // Analytics Queries
  GET_THOUGHT_CHAIN: `
    MATCH path = (start:Thought {id: $startId})-[:REVISES|BRANCHES_FROM*]->(end:Thought)
    WHERE NOT (end)-[:REVISES|BRANCHES_FROM]->()
    RETURN path
  `,

  GET_RELATED_THOUGHTS: `
    MATCH (t:Thought {id: $thoughtId})
    CALL gds.nodeSimilarity.stream({
      nodeProjection: 'Thought',
      relationshipProjection: {
        RELATED: {
          type: '*',
          orientation: 'UNDIRECTED'
        }
      }
    })
    YIELD node1, node2, similarity
    WHERE node1 = id(t) AND similarity > 0.5
    RETURN node2 AS relatedThought, similarity
    ORDER BY similarity DESC
    LIMIT 5
  `,

  // HPC Integration
  MARK_FOR_PROCESSING: `
    MATCH (t:Thought)
    WHERE t.status = 'active' AND NOT EXISTS(t.hpcProcessed)
    WITH t LIMIT $batchSize
    SET t.hpcStatus = 'queued',
        t.queuedAt = datetime()
    RETURN t
  `,

  UPDATE_HPC_RESULT: `
    MATCH (t:Thought {id: $thoughtId})
    SET t.hpcStatus = $status,
        t.hpcResult = $result,
        t.processedAt = datetime()
    RETURN t
  `
};