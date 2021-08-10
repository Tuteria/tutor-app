export let HOST = process.env.HOST_ENDPOINT || "http://backup.tuteria.com:8000";
export let DEV = (process.env.IS_DEVELOPMENT || "development") == "development";
const NOTIFICATION_SERVICE =
  process.env.NOTIFICATION_SERVICE || "http://email-service.tuteria.com:5000";
const SCHEDULER_SERVICE =
  process.env.SCHEDULER_SERVICE || "http://email-service.tuteria.com:8092";
export const IS_TEST = process.env.IS_TEST || "true";
const TEST_EMAIL = process.env.TEST_EMAIL || "";
const TEST_NUMBER = process.env.TEST_NUMBER || "";

export const sampleHostService = async () => {
  return "sample host request result";
};
