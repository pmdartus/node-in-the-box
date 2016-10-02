module.exports = `
type Run {
  id: String!
  content: String!
  logs: [LogEntry]
}

type LogEntry {
  ts: String!
  msg: String!
}

type Query {
  run(id: String!): Run
}

type Mutation {
  postRun(
    content: String!
  ): Run
}

schema {
  query: Query
  mutation: Mutation
}
`;
