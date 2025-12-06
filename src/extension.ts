import * as vscode from 'vscode';
import * as os from 'os';

export function activate(context: vscode.ExtensionContext) {
    const commandId = 'cpuUsage.changeInterval';
    const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    statusBar.tooltip = "cpu";
    statusBar.command = commandId;
    statusBar.show();
    context.subscriptions.push(statusBar);

    let lastTimes = os.cpus().map(cpu => cpu.times);
    let intervalHandle: NodeJS.Timeout | undefined;

    function getCpuUsage(): number[] {
        const cpus = os.cpus();
        const loads: number[] = [];

        cpus.forEach((cpu, i) => {
            const old = lastTimes[i];
            const current = cpu.times;

            const idleDelta = current.idle - old.idle;
            const totalDelta =
                (current.user - old.user) +
                (current.nice - old.nice) +
                (current.sys - old.sys) +
                (current.irq - old.irq) +
                idleDelta;

            let usage = 0;
            if (totalDelta > 0) {
                usage = 1 - (idleDelta / totalDelta);
            }

            loads.push(usage);
            lastTimes[i] = current;
        });

        return loads;
    }

    function toBar(level: number): string {
        const blocks = ["⡀", "⣀", "⣄", "⣤", "⣦", "⣶", "⣷", "⣿"];
        const clamped = Math.max(0, Math.min(1, level));
        const index = Math.floor(clamped * (blocks.length - 1));
        return blocks[index];
    }

    function updateStatusBar() {
        const loads = getCpuUsage();
        const bars = loads.map(u => toBar(u)).join("");
        statusBar.text = `CPU: ${bars}`;
    }

    function startInterval(ms: number) {
        if (intervalHandle) {
            clearInterval(intervalHandle);
        }
        updateStatusBar();
        intervalHandle = setInterval(updateStatusBar, ms);
    }

    context.subscriptions.push(vscode.commands.registerCommand(commandId, async () => {
        const options = ["500ms", "1000ms", "2000ms"];
        const selection = await vscode.window.showQuickPick(options, {
            placeHolder: "Select update frequency"
        });

        if (selection) {
            const ms = parseInt(selection.replace("ms", ""));
            startInterval(ms);
        }
    }));

    startInterval(2000);

    context.subscriptions.push({ dispose: () => {
        if (intervalHandle) clearInterval(intervalHandle);
    }});
}

export function deactivate() {}
