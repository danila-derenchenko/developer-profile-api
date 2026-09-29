export const typeDefs = `
  type Profile {
    id: ID!
    name: String!
  }

  type Query {
    profile: Profile
  }
`;
