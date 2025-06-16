const Joi = require("joi");

function buildJoiSchema(fields) {
  const schemaShape = {};
  for (const key in fields) {
    const field = fields[key];
    let rule;
    let messages = {};

    switch (field.type) {
      case "text":
        rule = Joi.string();
        if (field.emptyError) messages["string.empty"] = field.requiredError;
        if (field.minLength) {
          rule = rule.min(field.minLength);
          if (field.minError) messages["string.min"] = field.minError;
        }
        if (field.maxLength) {
          rule = rule.max(field.maxLength);
          if (field.maxError) messages["string.max"] = field.maxError;
        }
        if (field.required) {
          rule = rule.required();
          if (field.requiredError)
            messages["any.required"] = field.requiredError;
        }
        break;
      case "email":
        rule = Joi.string().email();
        if (field.required) {
          rule = rule.required();
          if (field.requiredError)
            messages["any.required"] = field.requiredError;
        }
        if (field.emailError) messages["string.email"] = field.emailError;
        break;
      case "password":
        rule = Joi.string();
        if (field.minLength) {
          rule = rule.min(field.minLength);
          if (field.minError) messages["string.min"] = field.minError;
        }
        if (field.maxLength) {
          rule = rule.max(field.maxLength);
          if (field.maxError) messages["string.max"] = field.maxError;
        }
        if (field.required) {
          rule = rule.required();
          if (field.requiredError)
            messages["any.required"] = field.requiredError;
        }
        break;
      case "checkbox":
        rule = Joi.boolean();
        if (field.required) {
          rule = rule.valid(true).required();
          if (field.requiredError) messages["any.only"] = field.requiredError;
        }
        break;
      // Add more types as needed
      default:
        rule = Joi.any();
    }

    // Attach messages if any
    if (Object.keys(messages).length > 0) {
      rule = rule.messages(messages);
    }

    schemaShape[key] = rule;
  }
  return Joi.object(schemaShape);
}

module.exports = { buildJoiSchema };
