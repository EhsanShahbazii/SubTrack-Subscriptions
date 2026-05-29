import * as vscode from 'vscode';
import { SubscriptionManager } from './subscriptionManager';
import { SubscriptionTreeDataProvider } from './treeDataProvider';
import {
  addSubscriptionCommand,
  clearAllCommand,
  deleteSubscriptionCommand,
  editSubscriptionCommand,
  seedSampleDataCommand,
} from './commands';
import { generateSampleSubscriptions } from './utils';

export function activate(context: vscode.ExtensionContext): void {
  const manager = new SubscriptionManager(context);

  // Create TreeDataProvider and register native TreeView
  const treeDataProvider = new SubscriptionTreeDataProvider(manager);
  const treeView = vscode.window.createTreeView('subtrack.subscriptionsView', {
    treeDataProvider,
    showCollapseAll: true,
  });
  treeDataProvider.setTreeView(treeView);

  // Register commands
  context.subscriptions.push(
    treeView,
    vscode.commands.registerCommand('subtrack.addSubscription', () => addSubscriptionCommand(manager)),
    vscode.commands.registerCommand('subtrack.refresh', () => treeDataProvider.refresh()),
    vscode.commands.registerCommand('subtrack.editSubscription', (item) => editSubscriptionCommand(manager, item)),
    vscode.commands.registerCommand('subtrack.deleteSubscription', (item) => deleteSubscriptionCommand(manager, item)),
    vscode.commands.registerCommand('subtrack.seedSampleData', () => seedSampleDataCommand(manager)),
    vscode.commands.registerCommand('subtrack.clearAll', () => clearAllCommand(manager))
  );

  // Auto-refresh countdown every 15 minutes
  const autoRefreshTimer = setInterval(() => {
    treeDataProvider.refresh();
  }, 15 * 60 * 1000);

  context.subscriptions.push({
    dispose: () => clearInterval(autoRefreshTimer),
  });
}

export function deactivate(): void {}
