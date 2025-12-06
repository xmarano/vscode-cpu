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
    let useColors = true;

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

    function getColor(avgLoad: number): vscode.ThemeColor {
        if (avgLoad >= 0.8) {
            return new vscode.ThemeColor('charts.red');
        } else if (avgLoad >= 0.6) {
            return new vscode.ThemeColor('charts.orange');
        } else if (avgLoad >= 0.3) {
            return new vscode.ThemeColor('charts.yellow');
        }
        return new vscode.ThemeColor('charts.green');
    }

    function updateStatusBar() {
        const loads = getCpuUsage();
        const bars = loads.map(u => toBar(u)).join("");
        const avgLoad = loads.reduce((a, b) => a + b, 0) / loads.length;
        if (useColors) {
            statusBar.color = getColor(avgLoad);
        } else {
            statusBar.color = undefined;
        }
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
        const colorOption = useColors ? "Disable Colors" : "Enable Colors";
        const options = ["500ms", "1000ms", "2000ms", colorOption];
        const selection = await vscode.window.showQuickPick(options, {
            placeHolder: "Select update frequency or toggle colors"
        });

        if (selection) {
            if (selection === colorOption) {
                useColors = !useColors;
                updateStatusBar();
            } else {
                const ms = parseInt(selection.replace("ms", ""));
                startInterval(ms);
            }
        }
    }));

    startInterval(2000);

    context.subscriptions.push({ dispose: () => {
        if (intervalHandle) clearInterval(intervalHandle);
    }});
}

export function deactivate() {}
