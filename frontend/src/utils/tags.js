export const TAG_MAP = {
  devops:    { className: 'tag-devops',    label: 'DevOps'     },
  aws:       { className: 'tag-aws',       label: 'AWS'        },
  k8s:       { className: 'tag-k8s',       label: 'Kubernetes' },
  kubernetes:{ className: 'tag-k8s',       label: 'Kubernetes' },
  terraform: { className: 'tag-terraform', label: 'Terraform'  },
  linux:     { className: 'tag-linux',     label: 'Linux'      },
  cicd:      { className: 'tag-cicd',      label: 'CI/CD'      },
  docker:    { className: 'tag-docker',    label: 'Docker'     },
  security:  { className: 'tag-security',  label: 'Security'   },
  devsecops: { className: 'tag-security',  label: 'DevSecOps'  },
  lambda:    { className: 'tag-lambda',    label: 'Lambda'     },
  mongodb:   { className: 'tag-mongodb',   label: 'MongoDB'    },
  serverless:{ className: 'tag-lambda',    label: 'Serverless' },
}

export function getTagStyle(tag) {
  return TAG_MAP[tag?.toLowerCase()] || { className: 'tag-default', label: tag }
}

export const PRESET_TAGS = [
  { value: 'devops',    label: 'DevOps'     },
  { value: 'aws',       label: 'AWS'        },
  { value: 'k8s',       label: 'Kubernetes' },
  { value: 'terraform', label: 'Terraform'  },
  { value: 'lambda',    label: 'Lambda'     },
  { value: 'mongodb',   label: 'MongoDB'    },
  { value: 'cicd',      label: 'CI/CD'      },
  { value: 'docker',    label: 'Docker'     },
  { value: 'security',  label: 'Security'   },
  { value: 'linux',     label: 'Linux'      },
]

export const REACTIONS = [
  { key: 'fire',   emoji: '🔥', label: 'Fire'     },
  { key: 'rocket', emoji: '🚀', label: 'Rocket'   },
  { key: 'brain',  emoji: '🧠', label: 'Big Brain' },
  { key: 'bug',    emoji: '🐛', label: 'Bug'      },
  { key: 'star',   emoji: '⭐', label: 'Star'     },
]
