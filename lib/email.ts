import {
  SESClient,
  SendEmailCommand,
  SendEmailCommandOutput,
} from "@aws-sdk/client-ses";

// Interface for email parameters - like a contract defining what data we expect
interface EmailParams {
  to: string | string[];
  subject: string;
  htmlContent: string;
  textContent?: string;
}

// Interface for the function's return value
interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Create SES client with proper error handling for missing environment variables
const createSESClient = (): SESClient => {
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!region || !accessKeyId || !secretAccessKey) {
    throw new Error("Missing required AWS environment variables");
  }

  return new SESClient({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
};

const sesClient = createSESClient();

export async function sendEmail({
  to,
  subject,
  htmlContent,
  textContent,
}: EmailParams): Promise<EmailResult> {
  const fromEmail = process.env.SES_FROM_EMAIL;

  if (!fromEmail) {
    return {
      success: false,
      error: "SES_FROM_EMAIL environment variable is not set",
    };
  }

  console.log(`TO`, to)

  const params = {
    Source: fromEmail,
    Destination: {
      ToAddresses: Array.isArray(to) ? to : [to],
    },
    Message: {
      Subject: {
        Data: subject,
        Charset: "UTF-8",
      },
      Body: {
        Html: {
          Data: htmlContent,
          Charset: "UTF-8",
        },
        Text: {
          Data: textContent || htmlContent.replace(/<[^>]*>/g, ""), // Strip HTML as fallback
          Charset: "UTF-8",
        },
      },
    },
  };

  try {
    const command = new SendEmailCommand(params);
    const response: SendEmailCommandOutput = await sesClient.send(command);

    return {
      success: true,
      messageId: response.MessageId,
    };
  } catch (error) {
    console.error("Failed to send email:", error);

    // Handle different types of errors appropriately
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return {
      success: false,
      error: errorMessage,
    };
  }
}
