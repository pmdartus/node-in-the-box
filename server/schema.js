module.exports = `
enum RunStatus {
  PENDING
  RUNNING
  SUCCESS
  FAILED
}

type Script {
  id: ID!
  content: String!
  runs: [Run]
}

type Run {
  id: ID!
  script: Script!
  status: RunStatus!
  logs: [LogEntry]
}

type LogEntry {
  ts: String!
  msg: String!
}

type Query {
  script(id: String!): Script
  run(id: String!): Run
}

type Mutation {
  postScript(
    content: String!
  ): Script
}

schema {
  query: Query
  mutation: Mutation
}
`;
