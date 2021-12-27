"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.displaySuggestions = void 0;
var chalk_1 = __importDefault(require("chalk"));
var utils_1 = require("../../utils");
var space = utils_1.logger.space;
var displaySuggestions = function (msg) {
    var _a;
    console.log("".concat(space(2)).concat(chalk_1.default.green('suggestions:')));
    (_a = msg.suggestions) === null || _a === void 0 ? void 0 : _a.forEach(function (suggest) {
        console.log(chalk_1.default.green("".concat(space(4)).concat((suggest.messageId, suggest.desc))));
    });
};
exports.displaySuggestions = displaySuggestions;