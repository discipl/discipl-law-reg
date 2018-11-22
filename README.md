# discipl-law-reg

Library capable of interpreting published FLINT linked data models of official law and regulation and effectively perform the tasks identified in them as appropiate self sovereign actor through discipl software stack.

This library creates self sovereign id's automaticly and stores key information at a discipl-core supported platform (probably some local or private distributed wallet as you want to keep this private)

Enables possibillity to escalate towards convergent facillitation escalation process if any actor does not agree with
the automated process and logic or decisions of other actors.

NOTICE: highly experimental - expect the content below to change considerably

------------------------

discipl-law-reg includes a specification for a FLINT model expressed as linked data. It is probably published as verfiable claim with the whole model as JSON-LD as object. The subject of this claim can be used to verify whether the model is official. The model is closely tied to official law and regulations using official jurisdictional references. A FLINT model is created by hand though with a formal method called Calculemus and specific tooling this can be made straightforward and possibly automated to a certain extend (ongoing research). 

A flint model describes, closely related to official law texts in natural language, the actions actors can or must take under what conditions given a current situation which depends on the actions that have been taken before and evaluated facts. 

A flint-ld model within discipl consists out of 5 types of datastructures:

1) model : datastructure that defines a process closely tied to official law and regulation texts, that defines the roles entities can have in participating in this process and which is expressed as related actions in which an actor attends to a need for an object expressed by an recipient and solves this need if preconditions are met. It defines at least the following attributes

   - type : text, identifier to uniquely defines the model (as being a type for the cases that can be started with it) 
   - roles : list of roles
   - actions : list of actions
   - facts : list of facts
   - duties : list of duties
   - reference : text, containing a jurisdictional reference(s) to law/regulation this model is implied from
   
   There are always actions not referred to by other actions, which are the actions with which a process we call a "case" can start. When such start actions are triggered (through an expressed quite specific need for it) a new execution context is created and entities/agents get tied to roles (as how the actor of these start actions determins this)

2) role : datastructure that defines a role to which an a 

- name : text , a rolename to which a specific entity referenced through a (discipl) link or agent identified by a self sovereign identity can be tied in the context of a case

3) action : datastructure representing an action in which an actor attends to a need for a given action on a given object expressed by a recipient (having a right to be attended to) and solves this need if preconditions are met. Every action triggered results in a action to be taken when the preconditions are met. This gets logged like a fact through a verifiable claim expressed by the actor in attestation of the expressed need (which links it to the context of a case).

- type : text, sentence describing the action and which is used to reference an action within the model. This reference at least contains a concatenation of action and object and must be unique within the model. It represents the result for which the recipient expressed a need for and the actor is attending to.
  - action : text, one or few words denoting what action is done on the object
  - reference : text, containing a jurisdictional reference to law/regulation this action is implied from
  - actor : text, needs to be a role name as a reference to a role defined in this model. The actor refers to an agent attending to the needs of the recipient for the result of taking the defined action on the object defined in this action
  - object : json, the object on which the action executed by the actor is needed by the recipient. The object can be a entity or agent, or reference to such via a role reference too. The object can also be a reference to a fact or even action and obligation referring to their corresponding state (last logged fact of referenced fact type for instance) in the context of a case
  - recipient : text, needs to be a role name as a reference to a role defined in this model. The recipient refers to an agent having a need for the resulting object defined in this action
  - preconditions : boolean logic with references to facts defined in this model. The precondition evaluates whether this action can be logged as taken when enabled
  - create : a list of references to actions, duties and/or facts that are triggered by executing this action
  - terminate : a list of references to actions, duties and/or facts that are terminated (revoked) by executing this action
  
4) fact : a fact that can be created (when triggered) or terminated.

  - type : text , identifier used to reference the type of fact. Must be unique within this model
  - derivation-rule : requirement (referring to existence of a verifiable claim in relation to a role (tied to entity/agent)) or arithmetic function. The derivation rule is evaluated when the fact is created through an action that has been taken in the context of a case or evaluated in respect to a precondition (when and as much needed) after which the fact with the derivated result is logged as verifiable claim if it was not logged previously with the same result as logged last time in the context of a case. When terminated, all such claims are revoked.
  - reference : text, containing a jurisdictional reference to law/regulation this fact is implied from
  
5) duty : object denoting an duty (for an accountable entity) to execute one or more certain actions in the future as required by a claimant which can perform one or more actions as sanction when the accountable entity does not comply

  - type : text, sentence describing the duty and which is used to reference the duty within the model. This reference at least contains a concatenation of action and object and must be unique within the model.
  - accountable : text, needs to be a role name as a reference to a role defined in this model. The actor refers to a role (tied to an entity/agent) that is obligated to trigger certain actions (by expressing a need for it)
  - claimant : text, needs to be a role name as a reference to a role defined in this model. The actor refers to a role (tied to an entity/agent) that is obligating the accountable to trigger certain actions (by expressing a need for it)
  - create : list of one or more actions that creates this duty for the accountable (reference this duty in their create list), NB this list is automatically determined. 
  - terminate : list of one or more actions that will terminate this duty (references this duty in their terminate list), NB this list is automatically determined
  - sanction : list of one or more actions a claimant can trigger to sanction the accountable when not compying to this duty
  - reference : text, containing a jurisdictional reference to law/regulation this duty is implied from

The existence of a duty for a accountable entity/agent in the context of a case can be determined at any time.

With given flint-ld models, the discipl-law-reg API can be used to play a certain role in the processes defined in flint-ld models following official laws and regulations. The discipl-law-reg API closely ties this to the concept of entities in needs that are attendedTo by other entities (that have a need for this) and thereby builds upon the discipl-abundance-service and discipl-4sacan API's. A process state is determined at any time by expressed verifiable claims, actions resulting in new claims. Entities can run a flint-ld model (and thereby act according to law) as a given role. This will create an abundance services attending to specific needs (in reference to specific law) and which perform the actions that get automaticly triggered when preconditions are met etc. Such processes can halt on certain preconditions which entities can meet through expressing claims (or get attested by others) and wil resume once met. When referring to a case, a process is meant.

Because it is set up this way, entities can follow the same process with other entities on different discipl core supported platforms.

the discipl-law-reg API will resemble:

-getActiveCases(ssid, flint-ld-model-link)
-getRoles(case)
-getRoleDid(case, role)
-getPossibleActions(case (, role))
-getAction(case, action-reference)
-getActionState(case, action)
-getPrecondition(case, action)
-evalPrecondition(case, action)
-getFact(case, fact-reference)
-evalFact(case, fact)
-getDuty(case, duty-reference)
-getCurrentDuties(case, role)
-getPossibleSanctions(case, duty-reference)
-subscribe(ssid, role, flint-ld-model-link) : returns set of Promises to which event handlers can be tied
-take(action (, object))


notice that with this API you get insight , at any time, into what cases you as an entity (the given ssid to getActiveCases()) are participating and in what state the underlying process is: what your possible actions and duties to such actions are and in relation to duties under what kind of sanctioning. It also let's you determin how to meet preconditions to trigger those actions. Triggering an action is solely possible by expressing needs (through discipl-abundance-service) and meeting requirements (which has been expressed through the discipl-4sacan api) by having certain claims made by yourself or by others (including attestations). A helper funtion subscribe() helps an actor respond to events in which an action or duty becomes possible / in effect for him/her/it. This could be used to automate actors taking actions to a certain extend in the form of oracles or even smart contracts.

To escape computer says no situations, even when compying to law, running on a proper established FLINT model, it is expected you are able to use the discipl-pattern API on top of this to request a need for help with a case or conflict resolution.
Any entity can retrieve all active cases if having access to the platforms used, even when not having a role in it. You will only be able to monitor it then though. In this outsider role you can however also start conflict resolution through discipl-pattern when you think you are having a stake in this.

----------------------------------

An observation: a lot of laws have an action as starting point in which a person in need takes the initial action by supplying a lot of information in an application form. In practice, this is not where it should start, because it rather is a duty that is implied from having a need which can be solved through a solution expressed in that law, of which there can be multiple. Also, a lot of times the person in need should be able to be supported in supplying the required information. Such duties in respect to a need can be terminated if the initial need (as the real entry point of a case) is revoked. It may be possible to auto generate surrounding models that map expressed needs to real solutions solving them.
