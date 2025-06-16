const Joi = require("joi");

function buildJoiSchema(fields) {
  const schemaShape = {};
  for (const key in fields) {
    const field = fields[key];
    let rule;
    switch (field.type) {
      case "text":
        rule = Joi.string();
        if (field.minLength) rule = rule.min(field.minLength);
        if (field.maxLength) rule = rule.max(field.maxLength);
        if (field.required) rule = rule.required();
        break;
      case "email":
        rule = Joi.string().email();
        if (field.required) rule = rule.required();
        break;
      case "password":
        rule = Joi.string();
        if (field.minLength) rule = rule.min(field.minLength);
        if (field.required) rule = rule.required();
        break;
      case "checkbox":
        rule = Joi.boolean();
        if (field.required) rule = rule.valid(true).required();
        break;
      // Add more types as needed
      default:
        rule = Joi.any();
    }
    schemaShape[key] = rule;
  }
  return Joi.object(schemaShape);
}

module.exports = { buildJoiSchema };
