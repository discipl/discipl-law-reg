# discipl-law-reg

Library capable of interpreting published FLINT linked data models of official law and regulation and effectively perform the tasks identified in them as appropiate self sovereign actor through discipl software stack.

This library creates self sovereign id's automaticly and stores key information at a discipl-core supported platform (probably some local or private distributed wallet as you want to keep this private)

Enables possibillity to escalate towards convergent facillitation escalation process if any actor does not agree with
the automated process and logic or decisions of other actors.

NOTICE: highly experimental - expect the content below to change considerably

------------------------

discipl-law-reg includes a specification for a FLINT model expressed as linked data. It is probably published as verfiable claim with the whole model as JSON-LD as object. The subject of this claim can be used to verify whether the model is official. The model is closely tied to official law and regulations using official jurisdictional references. A FLINT model is created by hand though with a formal method called Calculemus and specific tooling this can be made straightforward and possibly automated to a certain extend (ongoing research).  

A flint-ld model within discipl consists out of 5 types of datastructures:

1) model : defines a process closely tied to official law and regulation texts, that defines the roles entities can have in participating in this process and which is expressed as related actions in which an actor attends to a need for an object expressed by an recipient and solves this need if preconditions are met. It defines at least the following attributes
   - roles : list of roles
   - actions : list of actions
   - facts : list of facts
   - obligations : list of obligations
   - reference : text, containing a jurisdictional reference to law/regulation this model is implied from
   There are always actions not referred to by other actions, which are the actions a proces can start. When such start actions are triggered (through an expressed quite specific need for it) a new execution context is created and entities tied to roles (as how the actor of these actions determins this)

2) role : text , a rolename to which a specific entity with a self sovereign identity can be tied

3) action : object representing an action in which an actor attends to a need for an object expressed by a recipient and solves this need if preconditions are met.
  - description : text, optional, containing a description, possibly with quotes from the referenced official law / regulation text
  - reference : text, containing a jurisdictional reference to law/regulation this action is implied from
  - actor : text, needs to be a role name as a reference to a role defined in this model. The actor refers to an entity attending to the needs for the resulting object defined in this action
  - object : json, object representing what is needed and is the result of this action's execution.
  - recipient : text, needs to be a role name as a reference to a role defined in this model. The recipient refers to an entity having a need for the resulting object defined in this action
  - preconditions : boolean logic with links to facts defined in this model. The precondition evaluates whether this action can be executed when triggered
  - create : a list of references to actions, obligations and/or facts that are triggered by executing this action
  - terminate : a list of references to actions, obligations and/or facts that are terminated (revoked) by executing this action
  
4) fact : a fact that can be created or terminated.
  - derivation-rule : requirement (referring to existence of a verifiable claim) or arithmetic function. The derivation rule is evaluated when created and logged as verifiable claim. When terminated, any such claim is revoked. 
  - reference : text, containing a jurisdictional reference to law/regulation this fact is implied from
  
5) obligation : object denoting an obligation (for an accountable entity) to execute one or more certain actions in the future as required by a claimant which can perform one or more actions as sanction when the accountable entity does not comply
  - accountable : text, needs to be a role name as a reference to a role defined in this model. The actor refers to an entity that is obligated to trigger certain actions (by expressing a need for it)
  - claimant : text, needs to be a role name as a reference to a role defined in this model. The actor refers to an entity that is obligating the accountable to trigger certain actions (by expressing a need for it)
  - create : list of actions the accountable is obligated to trigger (it depends if one of those is enough or all of them are neccasary; determinted by what actions, obligations and facts are terminated doing these actions)
  - terminate : list of actions that are terminated when this obligation comes into effect (when created though an action)
  - sanction : list of actions a claimant can trigger to sanction the accountable when not compying to this obligation
  - reference : text, containing a jurisdictional reference to law/regulation this obligation is implied from

With given flint-ld models, the discipl-law-reg API can be used to play a certain role in the processes defined in flint-ld models following official laws and regulations. The discipl-law-reg API closely ties this to the concept of entities in needs that are attendedTo by other entities (that have a need for this) and thereby builds upon the discipl-abundance-service and discipl-4sacan API's. A process state is determined at any time by expressed verifiable claims, actions resulting in new claims. Entities can run a flint-ld model (and thereby act according to law) as a given role. This will create an abundance services attending to specific needs (in reference to specific law) and which perform the actions that get automaticly triggered when preconditions are met etc. Such processes can halt on certain preconditions which entities can meet through expressing claims (or get attested by others) and wil resume once met. When referring to a case, a process is meant.

Because it is set up this way, entities can follow the same process with other entities on different discipl core supported platforms.

the discipl-law-reg API will resemble:

getActiveCases(ssid, role, flint-ld-model-link)
getRoles(case)
getRoleDid(case, role)
getPossibleActions(case)
getAction(case, action-reference)
getActionState(case, action)
getPrecondition(case, action)
evalPrecondition(case, action)
getFact(case, fact-reference)
evalFact(case, fact)
getObligation(case, obligation-reference)
getActiveObligations(case)
getPossibleSanctions(case)

notice that with this API you get insight , at any time, into what cases you as an entity (the given ssid to getActiveCases()) are participating and in what state the underlying process is: what your possible actions and obligations to such actions are under what kind of sanctioning. It also let's you determin how to meet preconditions to trigger those actions. Triggering an action is solely possible by meeting requirements (which has been expressed through the discipl-4sacan api) by having certain claims made by yourself or by others (including attestations)

To escape computer says no situations, even when compying to law, running on a proper established FLINT model, it is expected you are able to use the discipl-pattern API on top of this to request a need for help with a case or conflict resolution.
Any entity can retrieve all active cases if having access to the platforms used, even when not having a role in it. You will only be able to monitor it then though. In this outsider role you can however also start conflict resolution through discipl-pattern when you think you are having a stake in this.

