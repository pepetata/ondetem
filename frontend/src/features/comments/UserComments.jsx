import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Alert,
  Spinner,
  Form,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import OTButton from "../../components/OTButton";
import {
  fetchUserComments,
  updateComment,
  deleteComment,
  selectUserComments,
  selectCommentsLoading,
  selectCommentsSubmitting,
  selectCommentsError,
  clearError,
} from "../../redux/commentsSlice";
import "../../scss/UserComments.scss";

const UserComments = () => {
  const dispatch = useDispatch();
  const userComments = useSelector(selectUserComments);
  const loading = useSelector(selectCommentsLoading);
  const submitting = useSelector(selectCommentsSubmitting);
  const error = useSelector(selectCommentsError);
  const user = useSelector((state) => state.auth.user);

  const [editingComment, setEditingComment] = useState(null);
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    if (user) {
      dispatch(fetchUserComments());
    }
  }, [dispatch, user]);

  useEffect(() => {
    document.title = "Meus Comentários - Onde Tem?";
  }, []);

  const handleDeleteComment = async (commentId) => {
    if (window.confirm("Tem certeza que deseja excluir este comentário?")) {
      try {
        await dispatch(deleteComment(commentId)).unwrap();
      } catch (error) {
        console.error("Failed to delete comment:", error);
      }
    }
  };

  const handleEditComment = (comment) => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
  };

  const handleUpdateComment = async (commentId) => {
    if (!editContent.trim()) return;

    try {
      await dispatch(
        updateComment({ commentId, content: editContent.trim() })
      ).unwrap();
      setEditingComment(null);
      setEditContent("");
    } catch (error) {
      console.error("Failed to update comment:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditContent("");
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!user) {
    return (
      <Container className="my-5">
        <Alert variant="warning">
          Por favor, <Link to="/login">faça login</Link> para ver seus
          comentários.
        </Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container className="my-5">
        <div className="text-center">
          <Spinner animation="border" />
          <p className="mt-2">Carregando seus comentários...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="user-comments-page my-5">
      <Row>
        <Col>
          <div className="page-header mb-4">
            <h2>Meus Comentários</h2>
            <p className="text-muted">
              Gerencie todos os seus comentários em um só lugar
            </p>
          </div>

          {error && (
            <Alert
              variant="danger"
              dismissible
              onClose={() => dispatch(clearError())}
            >
              {error}
            </Alert>
          )}

          {userComments.length === 0 ? (
            <Card className="text-center py-5">
              <Card.Body>
                <h5>Nenhum Comentário Ainda</h5>
                <p className="text-muted">
                  Você ainda não fez nenhum comentário. Comece navegando pelos
                  anúncios e participe da conversa!
                </p>
                <Link to="/" className="btn btn-primary">
                  Navegar Anúncios
                </Link>
              </Card.Body>
            </Card>
          ) : (
            <div className="comments-grid">
              {userComments.map((comment) => (
                <Card key={comment.id} className="comment-card mb-3">
                  <Card.Body>
                    <div className="comment-header mb-3">
                      <div className="ad-info">
                        <h6 className="ad-title mb-1">
                          <Link
                            to={`/ad/view/${comment.ad_id}`}
                            className="text-decoration-none"
                          >
                            {comment.ad_title}
                          </Link>
                        </h6>
                        <small className="text-muted">
                          {formatDate(comment.created_at)}
                          {comment.updated_at !== comment.created_at && (
                            <span className="ms-1">(editado)</span>
                          )}
                        </small>
                      </div>
                      <div className="comment-actions">
                        <OTButton
                          variant="outline-primary"
                          className="me-2"
                          onClick={() => handleEditComment(comment)}
                          disabled={submitting}
                          imgSrc="/images/edit.png"
                          imgAlt="Editar"
                        >
                          Editar
                        </OTButton>
                        <OTButton
                          variant="outline-danger"
                          className="delete-btn"
                          onClick={() => handleDeleteComment(comment.id)}
                          disabled={submitting}
                          imgSrc="/images/delete.png"
                          imgAlt="Excluir"
                        >
                          Excluir
                        </OTButton>
                      </div>
                    </div>

                    {editingComment === comment.id ? (
                      <Form className="mt-3">
                        <Form.Group className="mb-3">
                          <Form.Control
                            as="textarea"
                            rows={3}
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            maxLength={1000}
                            disabled={submitting}
                          />
                          <Form.Text className="text-muted">
                            {editContent.length}/1000 caracteres
                          </Form.Text>
                        </Form.Group>
                        <div className="d-flex gap-2">
                          <OTButton
                            variant="primary"
                            onClick={() => handleUpdateComment(comment.id)}
                            disabled={!editContent.trim() || submitting}
                            imgSrc="/images/save.png"
                            imgAlt="Salvar"
                          >
                            {submitting ? "Salvando..." : "Salvar"}
                          </OTButton>
                          <OTButton
                            variant="secondary"
                            onClick={handleCancelEdit}
                            disabled={submitting}
                            imgSrc="/images/cancel.png"
                            imgAlt="Cancelar"
                          >
                            Cancelar
                          </OTButton>
                        </div>
                      </Form>
                    ) : (
                      <div className="comment-content">
                        {comment.content.split("\n").map((line, index) => (
                          <React.Fragment key={index}>
                            {line}
                            {index < comment.content.split("\n").length - 1 && (
                              <br />
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    )}
                  </Card.Body>
                </Card>
              ))}
            </div>
          )}

          <div className="comments-stats mt-4">
            <small className="text-muted">
              Total de comentários: {userComments.length}
            </small>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default UserComments;
