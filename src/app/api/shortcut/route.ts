import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const PIPELINE_URL = "https://cash-production-680c.up.railway.app/quick-upload";

  // Apple Shortcuts .shortcut format (unsigned plist as JSON)
  // iOS will prompt to import this when opened
  const shortcut = {
    WFWorkflowMinimumClientVersionString: "900",
    WFWorkflowMinimumClientVersion: 900,
    WFWorkflowIcon: {
      WFWorkflowIconStartColor: 65280, // Green
      WFWorkflowIconGlyphNumber: 59648,
    },
    WFWorkflowClientVersion: "2302.0.4",
    WFWorkflowOutputContentItemClasses: [],
    WFWorkflowHasOutputFallback: false,
    WFWorkflowInputContentItemClasses: [
      "WFGenericFileContentItem",
      "WFVideoMediaContentItem",
    ],
    WFWorkflowTypes: ["ActionExtension", "NCWidget"],
    WFWorkflowHasShortcutInputVariables: true,
    WFWorkflowActions: [
      // Step 1: Ask for instagram handle
      {
        WFWorkflowActionIdentifier: "is.workflow.actions.ask",
        WFWorkflowActionParameters: {
          WFAskActionPrompt: "@instagram handle",
          WFAskActionDefaultAnswer: "@",
          WFInputType: "Text",
        },
      },
      // Step 2: Store handle in variable
      {
        WFWorkflowActionIdentifier: "is.workflow.actions.setvariable",
        WFWorkflowActionParameters: {
          WFVariableName: "handle",
        },
      },
      // Step 3: Get shortcut input (the video)
      {
        WFWorkflowActionIdentifier: "is.workflow.actions.getvariable",
        WFWorkflowActionParameters: {
          WFVariable: {
            Value: {
              Type: "ExtensionInput",
            },
            WFSerializationType: "WFTextTokenAttachment",
          },
        },
      },
      // Step 4: Build the URL with handle
      {
        WFWorkflowActionIdentifier: "is.workflow.actions.urlencode",
        WFWorkflowActionParameters: {
          WFInput: {
            Value: {
              attachmentsByRange: {
                "{0, 1}": {
                  Type: "Variable",
                  VariableName: "handle",
                },
              },
              string: "\uFFFC",
            },
            WFSerializationType: "WFTextTokenString",
          },
        },
      },
      // Step 5: Set encoded handle variable
      {
        WFWorkflowActionIdentifier: "is.workflow.actions.setvariable",
        WFWorkflowActionParameters: {
          WFVariableName: "encodedHandle",
        },
      },
      // Step 6: Get the video again
      {
        WFWorkflowActionIdentifier: "is.workflow.actions.getvariable",
        WFWorkflowActionParameters: {
          WFVariable: {
            Value: {
              Type: "ExtensionInput",
            },
            WFSerializationType: "WFTextTokenAttachment",
          },
        },
      },
      // Step 7: Upload to pipeline
      {
        WFWorkflowActionIdentifier: "is.workflow.actions.downloadurl",
        WFWorkflowActionParameters: {
          WFHTTPMethod: "POST",
          WFHTTPBodyType: "File",
          WFURL: {
            Value: {
              attachmentsByRange: {
                "{87, 1}": {
                  Type: "Variable",
                  VariableName: "encodedHandle",
                },
              },
              string: `${PIPELINE_URL}?handle=\uFFFC`,
            },
            WFSerializationType: "WFTextTokenString",
          },
        },
      },
      // Step 8: Show notification
      {
        WFWorkflowActionIdentifier: "is.workflow.actions.notification",
        WFWorkflowActionParameters: {
          WFNotificationActionTitle: "Reel Submitted!",
          WFNotificationActionBody: "Your video is uploading to YouTube Shorts with EDM music.",
        },
      },
    ],
  };

  const plistXml = jsonToPlist(shortcut);

  return new NextResponse(plistXml, {
    headers: {
      "Content-Type": "application/x-apple-shortcut",
      "Content-Disposition": 'attachment; filename="FlowArtsPro.shortcut"',
    },
  });
}

// Convert JSON to Apple plist XML format
function jsonToPlist(obj: unknown): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n';
  xml += '<plist version="1.0">\n';
  xml += serializeValue(obj);
  xml += '\n</plist>';
  return xml;
}

function serializeValue(val: unknown): string {
  if (val === null || val === undefined) return '<string></string>';
  if (typeof val === 'boolean') return val ? '<true/>' : '<false/>';
  if (typeof val === 'number') {
    return Number.isInteger(val) ? `<integer>${val}</integer>` : `<real>${val}</real>`;
  }
  if (typeof val === 'string') {
    return `<string>${escapeXml(val)}</string>`;
  }
  if (Array.isArray(val)) {
    const items = val.map(v => serializeValue(v)).join('\n');
    return `<array>\n${items}\n</array>`;
  }
  if (typeof val === 'object') {
    const entries = Object.entries(val as Record<string, unknown>)
      .map(([k, v]) => `<key>${escapeXml(k)}</key>\n${serializeValue(v)}`)
      .join('\n');
    return `<dict>\n${entries}\n</dict>`;
  }
  return `<string>${String(val)}</string>`;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
