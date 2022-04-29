import { constructBody } from "./email";
import { serverAdapter } from "./server";
const NOTIFICATION_SERVICE =
  process.env.NOTIFICATION_SERVICE || "http://email-service.tuteria.com:5000";

export const templates = {
  login_code: "login_code",
  tutor_application_denied: "tutor_application_denied",
  tutor_application_approved: "tutor_application_approved",
  tutor_video_reupload: "tutor_video_reupload",
  tutor_identity_reupload: "tutor_identity_reupload",
  tutor_update_guarantors: "tutor_update_guarantors",
  tutor_update_step: "tutor_update_step",
  start_tutor_application: "start_tutor_application",
  application_take_test: "application_take_test",
  application_retake_test: "application_retake_test",
  application_step_2_completed: "application_step_2_completed",
  application_pending_review: "application_pending_review",
  application_approval_1: "application_approval_1",
  application_rejected: "application_rejected",
  application_completely_approved: "application_completely_approved",
};

export function chunkList(list, size) {
  const chunks = [];
  let count = 0;
  while (count < list.length) {
    chunks.push(list.slice(count, count + size));
    count += size;
  }
  return chunks;
}

class TutorApplicationEmail {
  email: string;
  userInfo?: any;
  constructor(email: string, userInfo?: any) {
    this.email = email;
    this.userInfo = userInfo;
  }
  async getUserInfo(withSubjects = false) {
    if (!this.userInfo) {
      this.userInfo = await serverAdapter.getTutorDetails(
        this.email,
        withSubjects
      );
    }
    return this.userInfo;
  }
  async api(payload) {
    const response = await fetch(`${NOTIFICATION_SERVICE}/send_message/`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await response.json();
  }
  async beganApplication() {
    let {
      tutorData: { personalInfo, application_url },
    } = await this.getUserInfo();
    if (application_url) {
      let payload = constructBody({
        template: templates.start_tutor_application,
        to: this.email,
        data: {
          firstName: personalInfo.firstName,
          applicationUrl: application_url,
        },
      });
      return await this.api(payload);
    }
  }
  rewriteUrl(text: string) {
    let { tutorData } = this.userInfo;
    let {
      appData: { currentStep },
      application_url,
    } = tutorData;
    return application_url.replace(
      `current_step=${currentStep}`,
      `current_step=${text || currentStep}`
    );
  }
  buildSubjectUrl() {
    let { tutorData, actualUrl } = this.userInfo;
    let { application_status } = tutorData;
    let url =
      application_status === "VERIFIED"
        ? `${actualUrl}?redirect_url=/subjects/`
        : this.rewriteUrl("subjects");
    return url;
  }
  async takeTest() {
    let { tutorSubjects, tutorData } = await this.getUserInfo(true);
    let testableSubjects = tutorSubjects.filter(
      (o) => o.status === "not-started" && o.canTakeTest
    );
    let { personalInfo } = tutorData;
    let url = this.buildSubjectUrl();
    let payload = constructBody({
      template: templates.application_take_test,
      to: this.email,
      data: {
        firstName: personalInfo.firstName,
        numberOfSubjects: testableSubjects.length,
        url,
      },
    });
    return await this.api(payload);
  }
  async retakeTest(subject: string) {
    let {
      tutorData: { personalInfo },
    } = await this.getUserInfo();
    let url = this.buildSubjectUrl();
    let payload = constructBody({
      template: templates.application_retake_test,
      to: this.email,
      data: {
        firstName: personalInfo.firstName,
        subjectName: subject,
        url,
      },
    });
    return await this.api(payload);
  }
  async beginVerification() {
    let {
      tutorData: { personalInfo },
    } = await this.getUserInfo();
    let url = this.rewriteUrl("verify");
    let payload = constructBody({
      template: templates.application_step_2_completed,
      to: this.email,
      data: {
        firstName: personalInfo.firstName,
        url,
      },
    });
    return await this.api(payload);
  }
  async completedVerification() {
    let {
      tutorData: { personalInfo },
    } = await this.getUserInfo();
    let payload = constructBody({
      template: templates.application_pending_review,
      to: this.email,
      data: {
        firstName: personalInfo.firstName,
      },
    });
    return await this.api(payload);
  }
  async tutorProfileVerified() {
    let {
      tutorData: { personalInfo },
    } = await this.getUserInfo();
    let payload = constructBody({
      template: templates.tutor_application_approved,
      to: this.email,
      data: {
        firstName: personalInfo.firstName,
        addNewSubjectsUrl: this.buildSubjectUrl(),
      },
    });
    return await this.api(payload);
  }
  async tutorApplicationRejected() {
    let {
      tutorData: { personalInfo },
    } = await this.getUserInfo();
    let payload = constructBody({
      template: templates.application_rejected,
      to: this.email,
      data: {
        firstName: personalInfo.firstName,
      },
    });
    return await this.api(payload);
  }
  async tutorApplicationCompleted() {
    let {
      tutorData: { personalInfo },
    } = await this.getUserInfo();
    let payload = constructBody({
      template: templates.application_completely_approved,
      to: this.email,
      data: {
        firstName: personalInfo.firstName,
      },
    });
    return await this.api(payload);
  }
}

export type TUTOR_APPLICATION_STEPS =
  | "start-application"
  | "take-test"
  | "retake-test"
  | "complete-step-2"
  | "pending-review"
  | "tutor-verified"
  | "tutor-rejected"
  | "tutor-application-complete"
  | "get-tutor-info";

export async function processTutorApplicationStepEmail(
  action: TUTOR_APPLICATION_STEPS,
  data: { email: string; [key: string]: any }
) {
  let instance = new TutorApplicationEmail(data.email);
  let options = {
    "get-tutor-info": () => instance.getUserInfo(),
    "start-application": () => instance.beganApplication(),
    "take-test": () => instance.takeTest(),
    "retake-test": () => instance.retakeTest(data.subject),
    "complete-step-2": () => instance.beginVerification(),
    "pending-review": () => instance.completedVerification(),
    "tutor-verified": () => instance.tutorProfileVerified(),
    "tutor-rejected": () => instance.tutorApplicationRejected(),
    "tutor-application-complete": () => instance.tutorApplicationCompleted(),
  };
  return await options[action]();
}
