import * as vscode from 'vscode';
import { Subscription } from './types';
import { SubscriptionManager } from './subscriptionManager';
import { calculateExpiry, getGroupNameForIcon } from './utils';

export type TreeItemElement = IconGroupTreeItem | SubscriptionTreeItem;

/**
 * Collapsible group node derived automatically from the icon.
 * Displayed with a meaningful name, e.g. "AI & Assistants", "Hosting & VPS".
 */
export class IconGroupTreeItem extends vscode.TreeItem {
  constructor(
    public readonly iconId: string,
    count: number
  ) {
    const displayName = getGroupNameForIcon(iconId);
    super(displayName, vscode.TreeItemCollapsibleState.Expanded);

    this.id = `icon_group_${iconId}`;
    this.contextValue = 'iconGroupItem';
    this.iconPath = new vscode.ThemeIcon(iconId);
    this.description = `${count} item${count === 1 ? '' : 's'}`;
    this.tooltip = `${displayName} (${count} subscription${count === 1 ? '' : 's'})`;
  }
}

/**
 * Leaf node representing an individual subscription under its icon group.
 */
export class SubscriptionTreeItem extends vscode.TreeItem {
  constructor(public readonly subscription: Subscription) {
    super(subscription.name, vscode.TreeItemCollapsibleState.None);

    const calc = calculateExpiry(subscription.expiryDate);
    this.id = subscription.id;
    this.contextValue = 'subscriptionItem';

    // Formatted remaining string in the tree item description
    this.description = calc.formattedRemaining;

    // Standard native VS Code icon without color overrides
    const iconId = subscription.icon || 'calendar';
    this.iconPath = new vscode.ThemeIcon(iconId);

    // Rich Markdown popover tooltip
    const tooltip = new vscode.MarkdownString();
    tooltip.isTrusted = true;
    tooltip.appendMarkdown(`### ${subscription.name}\n\n`);
    tooltip.appendMarkdown(`- **Icon Group:** \`${subscription.icon}\`\n`);
    tooltip.appendMarkdown(`- **Remaining:** \`${calc.formattedRemaining}\`\n`);
    tooltip.appendMarkdown(`- **Exact Expiry:** \`${new Date(subscription.expiryDate).toLocaleString()}\`\n`);
    if (subscription.account) {
      tooltip.appendMarkdown(`- **Account:** \`${subscription.account}\`\n`);
    }
    tooltip.appendMarkdown(`\n---\n*Right-click to Edit or Delete*`);
    this.tooltip = tooltip;
  }
}

export class SubscriptionTreeDataProvider implements vscode.TreeDataProvider<TreeItemElement> {
  private _onDidChangeTreeData: vscode.EventEmitter<TreeItemElement | undefined | null | void> =
    new vscode.EventEmitter<TreeItemElement | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<TreeItemElement | undefined | null | void> =
    this._onDidChangeTreeData.event;

  private treeView?: vscode.TreeView<TreeItemElement>;

  constructor(private readonly manager: SubscriptionManager) {
    this.manager.onDidChange(() => {
      this.refresh();
    });
  }

  public setTreeView(view: vscode.TreeView<TreeItemElement>): void {
    this.treeView = view;
    this.updateHeaderDescription();
  }

  public refresh(): void {
    this._onDidChangeTreeData.fire();
    this.updateHeaderDescription();
  }

  private updateHeaderDescription(): void {
    if (this.treeView) {
      const count = this.manager.getAll().length;
      this.treeView.description = `${count} active`;
    }
  }

  public getTreeItem(element: TreeItemElement): vscode.TreeItem {
    return element;
  }

  public getChildren(element?: TreeItemElement): Thenable<TreeItemElement[]> {
    // Top-level: Return collapsible icon groups
    if (!element) {
      const activeIcons = this.manager.getActiveIcons();
      const groupItems: TreeItemElement[] = [];

      for (const icon of activeIcons) {
        const subs = this.manager.getByIcon(icon);
        groupItems.push(new IconGroupTreeItem(icon, subs.length));
      }

      return Promise.resolve(groupItems);
    }

    // Children of an icon group: Return subscriptions with that icon
    if (element instanceof IconGroupTreeItem) {
      const subs = this.manager.getByIcon(element.iconId);
      const items = subs.map((s) => new SubscriptionTreeItem(s));
      return Promise.resolve(items);
    }

    return Promise.resolve([]);
  }
}
