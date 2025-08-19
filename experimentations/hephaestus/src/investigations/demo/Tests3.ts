// Assuming a simplified DAG representation:
interface PC {
    id: string;
    operand?: string;
    config?: string;
    left?: PC;
    right?: PC;
}
  
function dag2expr(node: PC): string {
    if (node.operand) {
        return `(${dag2expr(node.left!)} ${node.operand} ${dag2expr(node.right!)})`;
    } else {
        return node.config!
    }
} 


// Example DAG
const dag1: PC = {
    id: 'root',
    operand: '&&',
    left: {
        id: 'A',
        config: 'control-cfg-1'
    },
    right: {
        id: 'B',
        operand: '||',
        left: {
            id: 'C',
            config: 'control-cfg-2'
        },
        right: {
            id: 'D',
            config: 'control-cfg-3'
        }
    }
};  

const expr1 = dag2expr(dag1);
console.log(expr1); // (control-cfg-1 && (control-cfg-2 || control-cfg-3))