## Bug Report Template

name: 🐛 Bug Report
description: Report a bug to help us improve
title: "[BUG] "
labels: ["bug"]

body:
  - type: markdown
    attributes:
      value: |
        Thanks for taking the time to fill out this bug report! 🙌
  
  - type: textarea
    id: description
    attributes:
      label: Description
      description: Describe the bug you encountered
      placeholder: A clear and concise description of what the bug is
    validations:
      required: true
  
  - type: textarea
    id: steps
    attributes:
      label: Steps to Reproduce
      description: Steps to reproduce the behavior
      placeholder: |
        1. Go to...
        2. Click on...
        3. See error...
    validations:
      required: true
  
  - type: textarea
    id: expected
    attributes:
      label: Expected Behavior
      description: What should happen
      placeholder: A clear and concise description of what you expected to happen
    validations:
      required: true
  
  - type: textarea
    id: actual
    attributes:
      label: Actual Behavior
      description: What actually happened
      placeholder: Describe what actually happened
    validations:
      required: true
  
  - type: dropdown
    id: severity
    attributes:
      label: Severity
      options:
        - Low
        - Medium
        - High
        - Critical
    validations:
      required: true
  
  - type: textarea
    id: context
    attributes:
      label: Additional Context
      description: Any additional context
      placeholder: Screenshots, environment details, etc.
