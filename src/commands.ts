import * as vscode from 'vscode';
import { Subscription } from './types';
import { SubscriptionManager } from './subscriptionManager';
import { IconGroupTreeItem, SubscriptionTreeItem } from './treeDataProvider';
import { CURATED_CODICONS, generateSampleSubscriptions } from './utils';

/**
 * Sequential input flow to add a subscription.
 * When an icon is chosen, the subscription is automatically placed in that icon's group.
 */
export async function addSubscriptionCommand(
  manager: SubscriptionManager,
  iconGroupItem?: IconGroupTreeItem
): Promise<void> {
  // 1. Service name
  const name = await vscode.window.showInputBox({
    title: 'SubTrack: Add Subscription (1/4)',
    prompt: 'Enter the service or subscription name',
    placeHolder: 'e.g. Fidibo, Antigravity, Gemini',
    validateInput: (value) => (!value || value.trim().length === 0 ? 'Service name is required' : null),
  });

  if (!name) return;

  // 2. Duration type
  interface DurationPickItem extends vscode.QuickPickItem {
    type: 'days' | 'hours' | 'date';
  }

  const durationTypePick = await vscode.window.showQuickPick<DurationPickItem>(
    [
      { label: '$(calendar) Days left', description: 'Specify remaining days (e.g. 7, 24, 40)', type: 'days' },
      { label: '$(clock) Hours left', description: 'Specify remaining hours (e.g. 24, 64, 100)', type: 'hours' },
      { label: '$(milestone) Exact Date', description: 'Specify exact date (YYYY-MM-DD)', type: 'date' },
    ],
    {
      title: 'SubTrack: Expiration Format (2/4)',
      placeHolder: 'Choose how you want to define the expiration',
    }
  );

  if (!durationTypePick) return;

  // 3. Value input
  let computedExpiryDate: Date;
  if (durationTypePick.type === 'days') {
    const daysStr = await vscode.window.showInputBox({
      title: 'SubTrack: Days Remaining (3/4)',
      prompt: 'Enter number of days left',
      placeHolder: 'e.g. 30',
      validateInput: (v) => (isNaN(parseFloat(v)) || parseFloat(v) < 0 ? 'Please enter a valid positive number' : null),
    });
    if (!daysStr) return;
    computedExpiryDate = new Date(Date.now() + parseFloat(daysStr) * 24 * 60 * 60 * 1000);
  } else if (durationTypePick.type === 'hours') {
    const hoursStr = await vscode.window.showInputBox({
      title: 'SubTrack: Hours Remaining (3/4)',
      prompt: 'Enter number of hours left',
      placeHolder: 'e.g. 64',
      validateInput: (v) => (isNaN(parseFloat(v)) || parseFloat(v) < 0 ? 'Please enter a valid positive number' : null),
    });
    if (!hoursStr) return;
    computedExpiryDate = new Date(Date.now() + parseFloat(hoursStr) * 60 * 60 * 1000);
  } else {
    const dateStr = await vscode.window.showInputBox({
      title: 'SubTrack: Exact Date (3/4)',
      prompt: 'Enter date in YYYY-MM-DD format',
      placeHolder: 'YYYY-MM-DD',
      validateInput: (v) => (!/^\d{4}-\d{2}-\d{2}$/.test(v) ? 'Format must be YYYY-MM-DD' : null),
    });
    if (!dateStr) return;
    computedExpiryDate = new Date(`${dateStr}T23:59:59`);
  }

  // 4. Codicon selection (always prompt user to choose the icon group)
  const picked = await vscode.window.showQuickPick(
    CURATED_CODICONS.map((c) => ({ label: c.label, description: c.description, id: c.id })),
    {
      title: 'SubTrack: Select Icon Group (4/4)',
      placeHolder: 'Pick an icon symbol (defines the group, e.g. sparkle, server, book)',
    }
  );
  if (!picked) return;
  const selectedIconId = picked.id;

  // Optional account email
  const account = await vscode.window.showInputBox({
    title: 'Linked Account / Email (Optional)',
    prompt: 'Enter account email or note (or press Enter to skip)',
    placeHolder: 'e.g. user@gmail.com',
  });

  const newSub: Subscription = {
    id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    name: name.trim(),
    expiryDate: computedExpiryDate.toISOString(),
    icon: selectedIconId,
    account: account?.trim() ? account.trim() : undefined,
  };

  await manager.add(newSub);
  vscode.window.showInformationMessage(`Added "${newSub.name}" to group • ${selectedIconId}`);
}

/**
 * Inline or context menu edit command.
 */
export async function editSubscriptionCommand(
  manager: SubscriptionManager,
  item?: SubscriptionTreeItem
): Promise<void> {
  let targetSub: Subscription | undefined;

  if (item && item.subscription) {
    targetSub = item.subscription;
  } else {
    const all = manager.getAll();
    if (all.length === 0) {
      vscode.window.showInformationMessage('No subscriptions to edit.');
      return;
    }
    const picked = await vscode.window.showQuickPick(
      all.map((s) => ({ label: `$(${s.icon}) ${s.name}`, subscription: s })),
      { placeHolder: 'Select subscription to edit' }
    );
    if (!picked) return;
    targetSub = picked.subscription;
  }

  if (!targetSub) return;

  const action = await vscode.window.showQuickPick(
    [
      { label: '$(edit) Edit Name', action: 'name' },
      { label: '$(symbol-keyword) Change Icon Group', action: 'icon' },
      { label: '$(calendar) Update Expiration / Duration', action: 'expiry' },
      { label: '$(person) Edit Account Email', action: 'account' },
    ],
    {
      title: `Editing: ${targetSub.name}`,
      placeHolder: 'Choose what to modify',
    }
  );

  if (!action) return;

  if (action.action === 'name') {
    const newName = await vscode.window.showInputBox({
      value: targetSub.name,
      prompt: 'Enter new subscription name',
      validateInput: (v) => (!v || v.trim().length === 0 ? 'Name cannot be empty' : null),
    });
    if (newName && newName.trim() !== targetSub.name) {
      targetSub.name = newName.trim();
      await manager.update(targetSub);
      vscode.window.showInformationMessage(`Updated name to "${targetSub.name}"`);
    }
  } else if (action.action === 'icon') {
    const pickedIcon = await vscode.window.showQuickPick(
      CURATED_CODICONS.map((c) => ({
        label: c.label,
        description: c.description,
        id: c.id,
      })),
      { placeHolder: 'Pick a new icon group' }
    );
    if (pickedIcon) {
      targetSub.icon = pickedIcon.id;
      await manager.update(targetSub);
      vscode.window.showInformationMessage(`Moved "${targetSub.name}" to group • ${pickedIcon.id}`);
    }
  } else if (action.action === 'expiry') {
    const choice = await vscode.window.showQuickPick(
      [
        { label: '$(calendar) Set Days left', mode: 'days' },
        { label: '$(clock) Set Hours left', mode: 'hours' },
        { label: '$(milestone) Set Exact Date (YYYY-MM-DD)', mode: 'date' },
      ],
      { placeHolder: 'Select new expiry format' }
    );
    if (!choice) return;

    if (choice.mode === 'days') {
      const val = await vscode.window.showInputBox({
        prompt: 'Enter days remaining from now',
        validateInput: (v) => (isNaN(parseFloat(v)) || parseFloat(v) < 0 ? 'Invalid number' : null),
      });
      if (val) {
        targetSub.expiryDate = new Date(Date.now() + parseFloat(val) * 24 * 60 * 60 * 1000).toISOString();
        await manager.update(targetSub);
        vscode.window.showInformationMessage(`Updated expiry for "${targetSub.name}"`);
      }
    } else if (choice.mode === 'hours') {
      const val = await vscode.window.showInputBox({
        prompt: 'Enter hours remaining from now',
        validateInput: (v) => (isNaN(parseFloat(v)) || parseFloat(v) < 0 ? 'Invalid number' : null),
      });
      if (val) {
        targetSub.expiryDate = new Date(Date.now() + parseFloat(val) * 60 * 60 * 1000).toISOString();
        await manager.update(targetSub);
        vscode.window.showInformationMessage(`Updated expiry for "${targetSub.name}"`);
      }
    } else {
      const val = await vscode.window.showInputBox({
        prompt: 'Enter date in YYYY-MM-DD format',
        validateInput: (v) => (!/^\d{4}-\d{2}-\d{2}$/.test(v) ? 'Format must be YYYY-MM-DD' : null),
      });
      if (val) {
        targetSub.expiryDate = new Date(`${val}T23:59:59`).toISOString();
        await manager.update(targetSub);
        vscode.window.showInformationMessage(`Updated expiry for "${targetSub.name}"`);
      }
    }
  } else if (action.action === 'account') {
    const acc = await vscode.window.showInputBox({
      value: targetSub.account || '',
      prompt: 'Enter account email (leave empty to clear)',
    });
    if (acc !== undefined) {
      targetSub.account = acc.trim() || undefined;
      await manager.update(targetSub);
      vscode.window.showInformationMessage(`Updated account note for "${targetSub.name}"`);
    }
  }
}

/**
 * Deletes a subscription with modal confirmation.
 */
export async function deleteSubscriptionCommand(
  manager: SubscriptionManager,
  item?: SubscriptionTreeItem
): Promise<void> {
  let targetSub: Subscription | undefined;

  if (item && item.subscription) {
    targetSub = item.subscription;
  } else {
    const all = manager.getAll();
    if (all.length === 0) return;
    const picked = await vscode.window.showQuickPick(
      all.map((s) => ({ label: `$(${s.icon}) ${s.name}`, subscription: s })),
      { placeHolder: 'Select subscription to delete' }
    );
    if (!picked) return;
    targetSub = picked.subscription;
  }

  if (!targetSub) return;

  const confirm = await vscode.window.showWarningMessage(
    `Delete subscription "${targetSub.name}"?`,
    { modal: true },
    'Delete'
  );

  if (confirm === 'Delete') {
    await manager.delete(targetSub.id);
    vscode.window.showInformationMessage(`Deleted "${targetSub.name}"`);
  }
}

export async function seedSampleDataCommand(manager: SubscriptionManager): Promise<void> {
  const samples = generateSampleSubscriptions();
  await manager.setAll(samples);
  vscode.window.showInformationMessage(`Loaded ${samples.length} sample subscriptions grouped by icon.`);
}

export async function clearAllCommand(manager: SubscriptionManager): Promise<void> {
  const confirm = await vscode.window.showWarningMessage(
    'Are you sure you want to delete ALL subscriptions?',
    { modal: true },
    'Clear All'
  );

  if (confirm === 'Clear All') {
    await manager.clearAll();
    vscode.window.showInformationMessage('All subscriptions cleared.');
  }
}
