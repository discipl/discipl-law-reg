# discipl-law-reg
Library capable of interpreting published FLINT linked data models of official law and regulation and support self sovereign actors to effectively perform the tasks identified in them through discipl software stack.

This library creates self sovereign id's in relation to needs automatically and stores key information at a discipl-core supported platform (probably some local or private distributed wallet as you want to keep this private)

Enables possibility to escalate towards an escalation process (convergent facilitation) if any actor does not agree with the automated process and logic or decisions of other actors.

**NOTICE:** highly experimental - expect the content below to change considerably

------------------------

## FLINT models
discipl-law-reg includes a specification for a FLINT model expressed as linked data. For now it is published as a verfiable claim with the whole model as JSON-LD as object. The subject of this claim can be used to verify whether the model is official. The model is closely tied to official law and regulations using official jurisdictional references. A FLINT model is created by hand though with a formal method called _Calculemus_ and specific tooling. This can be made straightforward and possibly automated to a certain extend (ongoing research).

A flint model describes, closely related to official law texts in natural language, the actions actors can or must take in the future (actions and duties). It also describes under what conditions, given a current situation which depends on the actions that have been taken before and evaluated facts.

A flint-ld model within discipl consists out of 4 types of datastructures: model, act, fact and duty.

### Model
Datastructure that defines a process closely tied to official law and regulation texts. It is expressed as a list of related actions in which an actor attends to a need for an object expressed by another actor as interested party. The actor can solve this need by denoting the action as been taken which is only possible if the preconditions are met. It defines at least the following attributes:

  - model : text, identifier to uniquely defines the model (as being a type for the cases that can be started with it)
  - acts : list of acts
  - facts : list of facts
  - duties : list of duties
  - reference : text, containing a jurisdictional reference(s) to law/regulation this model is implied from

There are always actions within a model, not referred to by other actions, which are the actions with which a process we call a "case" can start. A case is created by denoting a need for such action, which is only solved when the action is taken and all subsequent actions that are created by doing so (by expressing a need for those actions in this context) are solved too.

### Act
Datastructure representing an action in which an actor attends to a need for a given action on a given object expressed by a interested party (having a right to be attended to). The actor can solve this need by denoting the action as been taken if all preconditions are met. This gets logged like a fact through a verifiable claim expressed by the actor being an attestation of the expressed need (which links it to the context of a case). Also when a action is "taken", needs for other actions (or duties) can be created or revoked.

An action may contain the following attributes:

  - act : `text` - A sentence describing the action and which is used to reference an action within the model. This reference at least references the action and object and must be unique within the model. It represents the result for which the interested party expressed a need for and the actor is attending to
  - action : `text` - One or few words denoting what action is done on the object
  - reference : `text` - Containing a jurisdictional reference to law/regulation this action is implied from
  - actor : `text` - Needs to be a fact that defines a certain actor (and how to identify/authenticate an actor in a certain role). The actor refers to an agent attending to the needs of the recipient for the result of taking the defined action on the object (including providing this object) defined in this action
  - object : `json` - The object on which the action executed by the actor is needed by the recipient. The object can be a entity or agent, or reference to such via a fact reference too. The object can also be a reference to any other fact or even action and duty referring to their corresponding state (last logged fact of referenced fact type for instance) in the context of a case
  - interested party: `text` - Needs to be a fact that defines a certain actor (and how to identify/authenticate an actor in a certain role). The interested party refers to an agent having a need for the resulting object defined in this action
  - preconditions : `boolean` - Logic with references to facts defined in this model. The precondition evaluates whether this action can be logged as taken
  - create : `list` - A list of references to actions, duties and/or facts that are denoted as needed by taking this action
  - terminate : `list` - A list of references to actions, duties and/or facts that are terminated (revoked) by taking this action

### Fact
A fact defines a method that can be evaluated at any time, logging the result as fact

  - fact : `text` - Identifier used to reference the type of fact. Must be unique within this model
  - function : `text|expressions` - Requirement either referring to existence of a certain attestation in relation to an actor (defined through a fact) or an arithmetic function. The function is evaluated when the fact is referenced in an action being taken in the context of a case or evaluated in respect to a precondition (when and as much needed). After evaluation the fact with the result of the evaluated function is logged as verifiable claim. When terminated, all such claims are revoked.
  - reference : `text` - Containing a jurisdictional reference to law/regulation this fact is implied from

### Duty
An oject denoting a duty (for an accountable actor) to execute one or more certain actions in the future as required by a claimant which can perform one or more actions as enforcement when the accountable entity does not comply

  - duty : `text` - Sentence describing the duty and which is used to reference the duty within the model. This reference at least contains a concatenation of action and object and must be unique within the model.
  - duty-holder : `text` - Needs to be a fact that defines a certain actor (and how to identify/authenticate an actor in a certain role). The actor refers to a role (tied to an entity/agent) that is obligated to trigger certain actions (by expressing a need for it)
  - claimant : `text` - Needs to be a fact that defines a certain actor (and how to identify/authenticate an actor in a certain role). The actor refers to a role (tied to an entity/agent) that is obligating the accountable to trigger certain actions (by expressing a need for it)
  - create : `list` - A list of one or more actions that create this duty for the accountable (reference this duty in their create list), NB this list is automatically determined.
  - terminate : `list` - A list of one or more actions that will terminate this duty (references this duty in their terminate list), NB this list is automatically determined
  - enforce : `list` - A list of one or more actions a claimant can take to enforce the accountable when not complying to this duty
  - reference : `text` - containing a jurisdictional reference to law/regulation this duty is implied from

The existence of a duty for a accountable entity/agent in the context of a case can be determined at any time.

## Processing FLINT models
With given flint models, the discipl-law-reg API can be used to play a certain role in the processes defined in flint models following official laws and regulations. The discipl-law-reg API closely ties this to the concept of entities in needs that are attendedTo by other entities (that have a need for this) and thereby builds upon the discipl-abundance-service and discipl core API's. A process state is determined at any time by expressed verifiable claims that log needs for actions and facts at certain points in time when taking actions resulting in new claims. Entities can act following a flint model (and thereby act according to law) as a given role. This will create abundance services attending to specific needs (in reference to specific law) and which perform the actions that get automatically triggered when preconditions are met etc. Such processes can halt on certain preconditions which entities can meet through expressing claims (or get attested by others) and will resume once met. When referring to a case, a process is meant.

Because it is set up this way, actors can follow the same process with other actors over different discipl core supported platforms.

the discipl-law-reg API will resemble:

- publish(ssid, model) : publishes the FLINT JSON model in verifiable claims returning the list of possible start acts (discipl links to the claims defining the actions which are not being referenced by other actions in the model).
- get(case, actorDid) : returns a list of acts the given actor can take next given the current state of a case. The precondition of acts are evaluated and it's result is included in the result. Acts are included in the result even if the precondition does not evaluate to true. Note that the case is the did created through expressing a need for a specific start act in a flint model as returned by the publish() method. The result returned also includes whether actions (partfully) fulfil which enforceable duty (a link to a published model)
- observe(case, actorDid, (history=false)) : returns observable that can be used to handle changes in current acts to be taken (including enforceable duties relating to them) in relation to the given case. Optionally the history (forming a process trail) can be observed through this observable too.
- take(ssid, case, action (, obj) : log a current action (action reference) as been taken (only possible when precondition is met) optionally providing the object the action is taken upon. This will create new needs for subsequent actions to be taken or revoke such needs for actions created previously.

notice that with this and underlying API's you get insight, at any time, into what cases you as an actor are participating in and in what state the underlying process is: what your possible actions (and duties to such actions) are and in relation to duties under what kind of enforcement. It also let's you determin how to meet preconditions to trigger those actions. Taking actions is solely possible by expressing needs (through discipl-abundance-service) and meeting requirements (which has been expressed through the require() method in the discipl-abundance-service API (formerly discipl-4sacan)) by having certain claims made by yourself or by others (including attestations). A helper function observe() helps an actor respond to events in which an action or duty becomes possible / in effect for him/her/it. This could be used to automate actors taking actions to a certain extend in the form of oracles or even smart contracts.

To escape computer says no situations, even when complying to law, running on a proper established FLINT model, it is expected you are able to use the discipl-pattern API on top of this to request a need for help with a case or conflict resolution.
Any actor can retrieve all active cases if having access to the platforms used, even when not having a role in it. You will only be able to monitor it then though. However, in this outsider role you should be able to also start conflict resolution through discipl-pattern when you think you are having a stake in this.

------------------------------------

An observation: a lot of laws have an action as starting point in which a person in need takes the initial action by supplying a lot of information in an application form. In practice, this is not where it should start, because it rather is a duty that is implied from having a need which can be solved through a solution expressed in that law, of which there can be multiple. Also, a lot of times the person in need should be able to be supported in supplying the required information. Such duties in respect to a need can be terminated if the initial need (as the real entry point of a case) is revoked. It may be possible to auto generate surrounding flint models that help map expressed needs to real solutions solving them.
