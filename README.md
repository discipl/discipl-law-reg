# Discipl Law-Reg [![Build Status](https://travis-ci.org/discipl/discipl-law-reg.svg?branch=master)](https://travis-ci.org/discipl/discipl-law-reg)

Library capable of interpreting published FLINT models of official law and regulation and support actors with their self-sovereign ids to effectively perform the tasks identified in them through the [Discipl software stack](https://github.com/discipl).

This library creates self-sovereign ids in relation to needs automatically and stores key information at a discipl-core supported platform (probably some local or private distributed wallet as you want to keep this private)

This library also enables the possibility to escalate towards an escalation process (convergent facilitation) if any actor does not agree with the automated process and logic or decisions of other actors.

discipl-law-reg includes a specification for a FLINT model expressed as linked data. For now it is published as verifiable claim with the whole model as a JSON object. The subject of this claim can be used to verify whether the model is official. The model is closely tied to official law and regulations using official jurisdictional references. A FLINT model is created by hand though with a formal method called Calculemus and specific tooling this can be made straightforward and possibly automated to a certain extend (ongoing research).

More information and how to install the used tools and techniques which are named in the instructions, can be found at the [Discipl main page](https://github.com/discipl/main/blob/master/README.md).

And for more detailed information about the Law-Reg project, [click here](doc/vision.md)

**NOTICE:** highly experimental - expect the content to change considerably

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Installing

#### 1. To have this project up and running you first need to have Node.js installed locally.

#### 2. To install the dependencies that the project needs, you have to execute:
In the projects root folder:
  ```
  npm install
  ```

#### 3. After installing the dependencies, the tests can be executed with:
Also in the projects root folder:
```
npm test
```

After completing these steps, you have to see the result of the tests declared inside the test folder.
