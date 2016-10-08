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
  createDate: String!
  runs: [Run]
}

type Run {
  id: ID!
  script: Script!
  status: RunStatus!
  createDate: String!
  duration: Int!
  logs: [String!]
}

type Query {
  scripts(limit: Int!, offset: Int): [Script]
  script(id: ID!): Script

  runs(limit: Int!, offset: Int): [Run]
  run(id: ID!): Run
}

type Mutation {
  postScript(
    content: String!
  ): Script

  executeScript(
    id: ID!
  ): Run
}

schema {
  query: Query
  mutation: Mutation
}
`;
