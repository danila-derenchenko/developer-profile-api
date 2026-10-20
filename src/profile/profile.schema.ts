export const profileSchema = `
  scalar DateTime

  type ProfessionalLink {
    id: ID!
    label: String!
    url: String!
  }

  type Skill {
    id: ID!
    name: String!
  }

  type Experience {
    id: ID!
    company: String!
    position: String!
    startDate: DateTime!
    "Null means the position is current. Dates are serialized in UTC."
    endDate: DateTime
    achievements: [String!]!
  }

  type Project {
    id: ID!
    name: String!
    description: String!
    url: String!
  }

  type Profile {
    id: ID!
    name: String!
    description: String!
    links: [ProfessionalLink!]!
    skills: [Skill!]!
    experience: [Experience!]!
    projects: [Project!]!
  }

  type Query {
    profile: Profile!
  }
`;
