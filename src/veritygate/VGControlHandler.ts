import { DataStore } from "./VGStore";

/**
 * Control Handler for VerityGate
 * 
 * The Control Handler (CH) goes throough all the controls in the store and notify the actors with the relevant roles.
 * Notification can be a web hook, SNS or any other mean.
 * The payload must contain the wish payload being processed.
 * 
 * The CH stores for each actor its approval or refusal and evaluates the condition if present.
 * If the control expires the wish is rejected by default.
 */
export class VGControlHandler {
  private store: DataStore;

  /**
   * @param store The data store
   */
  constructor(store: DataStore) {
    this.store = store;
  }

  /**
   * This function is called periodically or by event
   * We want to process and update the statuses of the controls.
   * This needs to be done by org id and by increase order of the control index.
   * The idea is to build, for a given wish id, a map of wish id to a list of control ids for a given group.
   * 
   * Imagine a wish id, with 2 orgs (top down), org1 and org2, and one control 1 for org1 and two controls 2, 3 for org2.
   * Each control must be evaluated to pass before moving on to the next one:
   * - control1 for org1 must pass, then
   * - control2 for org2 must pass,
   * - finally control3 for org2 must pass
   * 
   * Therefore we read from the store and sort by index - (implementation note, the index can be global and we do not need the wish id)
   * We just need to store a flag alongside each control.. processing, processed, not_processed
   */
  processControls(): void {
    // List all un-processed controls
    // Persist each control with a tag of 'not_processed'
    // Apply the controls one by one and wait for a control approval before moving to the next one ('processing', 'approved' or 'declined')
    //   'processing': actors have been notified according to the controls config
    //   'approved'  : the control has passed moving on to the next one, if all approved, post a job to execute the wish
    //   'declined'  : reject the wish
  }
}
