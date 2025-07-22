/**
 * 提取
 */

import { parse as acornParse, type ObjectExpression } from "acorn";
import { simple as walkSimple } from "acorn-walk";
import { ScopeManager } from "./ScopeManager";

/**
 * 从script代码中提取api的参数值
 * @param scriptCode string
 * @param api string
 * @param params string[]
 * @returns
 */
export const extractParamValuesFromApi = (
  scriptCode: string,
  api: string,
  params: string[] = []
) => {
  let result: Record<string, any> = {};
  let apiUrl = api;
  try {
    // 解析代码生成 AST
    const ast = acornParse(scriptCode, {
      ecmaVersion: 2020,
      sourceType: "script",
    });
    const scopeManager = new ScopeManager();
    // 遍历 AST
    walkSimple(ast, {
      Function(node) {
        // scopeManager.enterScope();
      },
      BlockStatement(node) {
        // scopeManager.enterScope();
      },
      // 退出函数或块作用域
      //   'Function:exit'(node) {
      //     scopeManager.exitScope();
      //   },
      //   'BlockStatement:exit'(node) {
      //     scopeManager.exitScope();
      //   },
      // 变量声明
      VariableDeclarator(node) {
        if (node.id.type === "Identifier") {
          const name = node.id.name;
          let value = null;

          if (node.init) {
            if (node.init.type === "Literal") {
              value = node.init.value;
            } else if (node.init.type === "Identifier") {
              value = scopeManager.getVariableValue(node.init.name);
            } else {
              // 其他类型的初始化值（如对象、数组等）
              value = node.init;
            }
          }

          scopeManager.declareVariable(name, value);
        }
      },
      // 赋值表达式
      AssignmentExpression(node) {
        if (node.left.type === "Identifier") {
          const name = node.left.name;
          let value = null;

          if (node.right.type === "Literal") {
            value = node.right.value;
          } else if (node.right.type === "Identifier") {
            value = scopeManager.getVariableValue(node.right.name);
          } else {
            value = node.right;
          }

          scopeManager.declareVariable(name, value);
        }
      },
      CallExpression(node) {
        // 检查是否是 $.ajax 调用
        if (
          node.callee.type === "MemberExpression" &&
          node.callee.object.type === "Identifier" &&
          node.callee.object.name === "$" &&
          node.callee.property.type === "Identifier" &&
          node.callee.property.name === "ajax"
        ) {
          // 检查参数是否是对象字面量
          const ajaxOptions = node.arguments[0];
          if (ajaxOptions && ajaxOptions.type === "ObjectExpression") {
            let urlValue = "";
            let dataObject: ObjectExpression | null = null;

            // 找到 url 和 data 属性
            for (const prop of ajaxOptions.properties) {
              if (prop.type === "Property" && prop.key.type === "Identifier") {
                if (
                  prop.value.type === "Literal" &&
                  prop.key.name === "url" &&
                  typeof prop.value.value === "string"
                ) {
                  urlValue = prop.value.value;
                } else if (
                  prop.value.type === "ObjectExpression" &&
                  prop.key.name === "data"
                ) {
                  dataObject = prop.value;
                }
              }
            }

            // 检查 url 是否是 <api>
            if (urlValue.startsWith(api)) {
              apiUrl = urlValue;
              // 检查 data 是否是对象字面量
              if (dataObject && dataObject.type === "ObjectExpression") {
                for (const prop of dataObject.properties) {
                  if (
                    prop.type === "Property" &&
                    prop.key.type === "Literal" &&
                    typeof prop.key.value === "string" &&
                    params.includes(prop.key.value)
                  ) {
                    // 提取 参数 值
                    if (prop.value.type === "Literal") {
                      result[prop.key.value] = prop.value.value as string;
                    } else if (prop.value.type === "Identifier") {
                      // 如果 参数 是变量，需要进一步解析
                      const variableName = prop.value.name;
                      result[prop.key.value] =
                        scopeManager.getVariableValue<string>(variableName);
                    }
                  }
                }
              }
            }
          }
        }
      },
    });
  } catch (error) {
    console.error("解析代码时出错:", error);
  }
  return {
    params: result,
    apiUrl,
  };
};
