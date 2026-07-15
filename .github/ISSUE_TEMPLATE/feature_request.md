## Feature Request Template

name: ✨ Feature Request
description: Suggest a new feature
title: "[FEATURE] "
labels: ["enhancement"]

body:
  - type: markdown
    attributes:
      value: |
        Thanks for suggesting an improvement! 🚀
  
  - type: textarea
    id: description
    attributes:
      label: Feature Description
      description: Describe the feature you'd like to see
      placeholder: A clear and concise description of what you want to happen
    validations:
      required: true
  
  - type: textarea
    id: problem
    attributes:
      label: Problem It Solves
      description: What problem does this feature solve?
      placeholder: Is your feature request related to a problem? Describe it.
    validations:
      required: true
  
  - type: textarea
    id: alternative
    attributes:
      label: Alternative Solutions
      description: Have you considered any alternative solutions?
      placeholder: Describe any alternative solutions or features you've considered
  
  - type: dropdown
    id: priority
    attributes:
      label: Priority
      options:
        - Low
        - Medium
        - High
    validations:
      required: true
  
  - type: textarea
    id: context
    attributes:
      label: Additional Context
      description: Any additional context
      placeholder: Screenshots, examples, references, etc.
