/**
 * Example Workflow: Meeting Notes to CRM
 *
 * Demonstrates the "tools as code" pattern for a multi-step workflow
 * that would traditionally require many token-heavy tool calls.
 *
 * Workflow:
 * 1. Fetch meeting transcript from Google Drive
 * 2. Extract key points and action items
 * 3. Update Salesforce with meeting summary
 * 4. Post notification to Slack
 *
 * Traditional approach: ~150,000 tokens (transcript processed 3x)
 * Tools-as-code approach: ~2,000 tokens (transcript stays in sandbox)
 */

import * as gdrive from '../servers/google-drive';
import * as salesforce from '../servers/salesforce';
import * as slack from '../servers/slack';

interface MeetingContext {
  documentId: string;
  salesforceRecordId: string;
  slackChannel: string;
}

interface ProcessedMeeting {
  title: string;
  date: string;
  summary: string;
  keyPoints: string[];
  actionItems: ActionItem[];
  participants: string[];
}

interface ActionItem {
  task: string;
  assignee: string;
  dueDate?: string;
}

/**
 * Extract key information from meeting transcript
 * This runs entirely in the sandbox - transcript never leaves
 */
function extractMeetingInfo(transcript: string, title: string): ProcessedMeeting {
  // Simple extraction logic (in practice, could use local LLM or regex)
  const lines = transcript.split('\n');

  const keyPoints: string[] = [];
  const actionItems: ActionItem[] = [];
  const participants = new Set<string>();

  for (const line of lines) {
    // Extract speaker names
    const speakerMatch = line.match(/^([A-Z][a-z]+ [A-Z][a-z]+):/);
    if (speakerMatch) {
      participants.add(speakerMatch[1]);
    }

    // Extract action items (lines containing "action item" or "TODO")
    if (line.toLowerCase().includes('action item') || line.includes('TODO')) {
      const assigneeMatch = line.match(/@(\w+)/);
      actionItems.push({
        task: line.replace(/^.*?:/, '').trim(),
        assignee: assigneeMatch?.[1] ?? 'Unassigned',
      });
    }

    // Extract key points (lines starting with "Key:" or bullet points after "Summary")
    if (line.startsWith('Key:') || line.startsWith('- ')) {
      keyPoints.push(line.replace(/^(Key:|-)/, '').trim());
    }
  }

  // Generate summary (first 500 chars, truncated at sentence boundary)
  const summaryText = transcript.slice(0, 500);
  const lastPeriod = summaryText.lastIndexOf('.');
  const summary = lastPeriod > 0 ? summaryText.slice(0, lastPeriod + 1) : summaryText;

  return {
    title,
    date: new Date().toISOString().split('T')[0],
    summary,
    keyPoints: keyPoints.slice(0, 5), // Top 5 key points
    actionItems,
    participants: Array.from(participants),
  };
}

/**
 * Format meeting info for Salesforce notes field
 */
function formatForSalesforce(meeting: ProcessedMeeting): string {
  const sections = [
    `## Meeting: ${meeting.title}`,
    `**Date:** ${meeting.date}`,
    `**Participants:** ${meeting.participants.join(', ')}`,
    '',
    '### Summary',
    meeting.summary,
    '',
    '### Key Points',
    ...meeting.keyPoints.map(point => `- ${point}`),
    '',
    '### Action Items',
    ...meeting.actionItems.map(
      item => `- [ ] ${item.task} (@${item.assignee}${item.dueDate ? ` - Due: ${item.dueDate}` : ''})`
    ),
  ];

  return sections.join('\n');
}

/**
 * Format meeting info for Slack notification
 */
function formatForSlack(meeting: ProcessedMeeting, salesforceUrl: string): string {
  return [
    `:memo: *Meeting Notes Updated: ${meeting.title}*`,
    '',
    `> ${meeting.summary.slice(0, 200)}...`,
    '',
    `*Action Items:* ${meeting.actionItems.length}`,
    `*Key Points:* ${meeting.keyPoints.length}`,
    '',
    `<${salesforceUrl}|View in Salesforce>`,
  ].join('\n');
}

/**
 * Main workflow: Process meeting and update systems
 *
 * Notice how the transcript (potentially 50,000+ tokens) is:
 * 1. Fetched once
 * 2. Processed entirely in the sandbox
 * 3. Only small summaries sent to external systems
 *
 * The model never sees the raw transcript - massive token savings!
 */
export async function processMeetingNotes(context: MeetingContext): Promise<{
  success: boolean;
  meeting: ProcessedMeeting;
  salesforceUrl: string;
}> {
  console.log('Starting meeting notes processing...');

  // Step 1: Fetch transcript from Google Drive
  // The full transcript stays in the sandbox
  console.log(`Fetching document: ${context.documentId}`);
  const document = await gdrive.getDocument({
    documentId: context.documentId,
    format: 'text',
  });

  const transcript = String(document.content);
  console.log(`Retrieved transcript: ${transcript.length} characters`);

  // Step 2: Extract key information (runs locally, no tokens used)
  const meeting = extractMeetingInfo(transcript, String(document.content));
  console.log(`Extracted: ${meeting.keyPoints.length} key points, ${meeting.actionItems.length} action items`);

  // Step 3: Update Salesforce with summary (only ~500 chars sent)
  const salesforceNotes = formatForSalesforce(meeting);
  console.log(`Updating Salesforce record: ${context.salesforceRecordId}`);

  await salesforce.updateRecord({
    objectType: 'SalesMeeting',
    recordId: context.salesforceRecordId,
    data: {
      Notes: salesforceNotes,
      MeetingDate: meeting.date,
      Participants: meeting.participants.join('; '),
      ActionItemCount: meeting.actionItems.length,
      Status: 'Processed',
    },
  });

  const salesforceUrl = `https://yourorg.salesforce.com/${context.salesforceRecordId}`;

  // Step 4: Post Slack notification (only ~300 chars sent)
  const slackMessage = formatForSlack(meeting, salesforceUrl);
  console.log(`Posting to Slack channel: ${context.slackChannel}`);

  await slack.postMessage({
    channel: context.slackChannel,
    text: slackMessage,
    unfurlLinks: false,
  });

  console.log('Meeting notes processing complete!');

  // Return summary to model (transcript never exposed)
  return {
    success: true,
    meeting,
    salesforceUrl,
  };
}

/**
 * Batch process multiple meetings
 *
 * Native loops replace sequential tool calls - much more efficient!
 */
export async function batchProcessMeetings(
  meetings: MeetingContext[]
): Promise<Map<string, { success: boolean; error?: string }>> {
  const results = new Map<string, { success: boolean; error?: string }>();

  console.log(`Processing ${meetings.length} meetings...`);

  for (const meeting of meetings) {
    try {
      await processMeetingNotes(meeting);
      results.set(meeting.documentId, { success: true });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Failed to process ${meeting.documentId}: ${errorMessage}`);
      results.set(meeting.documentId, { success: false, error: errorMessage });
    }
  }

  const successCount = Array.from(results.values()).filter(r => r.success).length;
  console.log(`Completed: ${successCount}/${meetings.length} successful`);

  return results;
}

// Example usage
async function main() {
  const context: MeetingContext = {
    documentId: 'abc123',
    salesforceRecordId: '00Q5f000001abcXYZ',
    slackChannel: '#sales-meetings',
  };

  const result = await processMeetingNotes(context);
  console.log('Result:', JSON.stringify(result, null, 2));
}

// Run if executed directly
main().catch(console.error);
