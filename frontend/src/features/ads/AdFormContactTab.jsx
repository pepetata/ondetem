import { Row, Col, Form } from "react-bootstrap";
import { Field } from "formik";
import FormInput from "../../components/FormInput";
import ZipCodeField from "../../components/ZipCodeField";

export default function AdFormContactTab({ adFormFields, formikRef }) {
  return (
    <Row className="justify-content-center px-2 px-lg-5">
      <Row>
        <Col md={3}>
          <ZipCodeField
            name={adFormFields.zipcode.name}
            formik={formikRef.current}
            adFormFields={adFormFields}
          />
        </Col>
        <Col md={7}>
          <Field name={adFormFields.city.name}>
            {({ field, form }) => (
              <FormInput field={field} form={form} {...adFormFields.city} />
            )}
          </Field>
        </Col>
        <Col md={2}>
          <Field name={adFormFields.state.name}>
            {({ field, form }) => (
              <FormInput field={field} form={form} {...adFormFields.state} />
            )}
          </Field>
        </Col>
      </Row>
      <Row>
        <Col md={6}>
          <Field name={adFormFields.address1.name}>
            {({ field, form }) => (
              <FormInput field={field} form={form} {...adFormFields.address1} />
            )}
          </Field>
        </Col>
        <Col md={2}>
          <Field name={adFormFields.streetnumber.name}>
            {({ field, form }) => (
              <FormInput
                field={field}
                form={form}
                {...adFormFields.streetnumber}
              />
            )}
          </Field>
        </Col>
        <Col md={4}>
          <Field name={adFormFields.address2.name}>
            {({ field, form }) => (
              <FormInput field={field} form={form} {...adFormFields.address2} />
            )}
          </Field>
        </Col>
      </Row>
      <Row>
        <Col md={4}>
          <Form.Group>
            <Form.Label>{adFormFields.radius.label}</Form.Label>
            <Field
              as="select"
              name={adFormFields.radius.name}
              className="form-select"
            >
              {adFormFields.radius.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Field>
          </Form.Group>
        </Col>
      </Row>
      <Row>
        <Col md={4}>
          <Field name={adFormFields.phone1.name}>
            {({ field, form }) => (
              <FormInput field={field} form={form} {...adFormFields.phone1} />
            )}
          </Field>
        </Col>
        <Col md={4}>
          <Field name={adFormFields.phone2.name}>
            {({ field, form }) => (
              <FormInput field={field} form={form} {...adFormFields.phone2} />
            )}
          </Field>
        </Col>
        <Col md={4}>
          <Field name={adFormFields.whatsapp.name}>
            {({ field, form }) => (
              <FormInput field={field} form={form} {...adFormFields.whatsapp} />
            )}
          </Field>
        </Col>
      </Row>
      <Form.Group controlId="email" className="mb-3">
        <Field name={adFormFields.email.name}>
          {({ field, form }) => (
            <FormInput field={field} form={form} {...adFormFields.email} />
          )}
        </Field>
      </Form.Group>
      <Form.Group controlId="website" className="mb-3">
        <Field name={adFormFields.website.name}>
          {({ field, form }) => (
            <FormInput field={field} form={form} {...adFormFields.website} />
          )}
        </Field>
      </Form.Group>
    </Row>
  );
}
