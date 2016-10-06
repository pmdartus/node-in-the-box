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
  duration: Int!
  logs: [String!]
}

type Query {
  script(id: ID!): Script
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
