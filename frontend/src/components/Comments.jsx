import React, { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, Form, Button, Alert, Spinner } from "react-bootstrap";
import OTButton from "./OTButton";
import {
  fetchCommentsByAdId,
  createComment,
  updateComment,
  deleteComment,
  selectCommentsByAdId,
  selectCommentsLoading,
  selectCommentsSubmitting,
  selectCommentsError,
  clearError,
} from "../redux/commentsSlice";
import "../scss/Comments.scss";

const Comments = ({ adId }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Create a memoized selector for this specific adId
  const selectCommentsForAd = useMemo(
    () => (state) => selectCommentsByAdId(state, adId),
    [adId]
  );

  const comments = useSelector(selectCommentsForAd);
  const loading = useSelector(selectCommentsLoading);
  const submitting = useSelector(selectCommentsSubmitting);
  const error = useSelector(selectCommentsError);
  const user = useSelector((state) => state.auth.user);

  const [newComment, setNewComment] = useState("");
  const [editingComment, setEditingComment] = useState(null);
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    if (adId) {
      dispatch(fetchCommentsByAdId(adId));
    }
  }, [dispatch, adId]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await dispatch(
        createComment({ adId, content: newComment.trim() })
      ).unwrap();
      setNewComment("");
    } catch (error) {
      console.error("Failed to create comment:", error);
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

  const handleDeleteComment = async (commentId) => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      try {
        await dispatch(deleteComment(commentId)).unwrap();
      } catch (error) {
        console.error("Failed to delete comment:", error);
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditContent("");
  };

  const handleLoginRedirect = () => {
    // Create return URL to come back to this page after login
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    navigate(`/login?returnUrl=${returnUrl}`);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading && comments.length === 0) {
    return (
      <div className="comments-section">
        <div className="text-center">
          <Spinner animation="border" size="sm" />
          <span className="ms-2">Carregando comentários...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="comments-section" data-testid="comments-section">
      <h5 className="comments-title">Comentários ({comments.length})</h5>

      {error && (
        <Alert
          variant="danger"
          dismissible
          onClose={() => dispatch(clearError())}
        >
          {error}
        </Alert>
      )}

      {/* Comment Form */}
      {user ? (
        <Card className="comment-form-card mb-3">
          <Card.Body>
            <Form onSubmit={handleSubmitComment}>
              <Form.Group className="mb-3">
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Escreva um comentário..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  maxLength={1000}
                  disabled={submitting}
                  data-testid="comment-input"
                />
                <Form.Text className="text-muted">
                  {newComment.length}/1000 caracteres
                </Form.Text>
              </Form.Group>
              <div className="d-flex justify-content-between align-items-center">
                <small className="text-muted">
                  Comentando como{" "}
                  {user.nickname || user.full_name || user.email}
                </small>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={!newComment.trim() || submitting}
                  size="sm"
                  data-testid="comment-submit"
                >
                  {submitting ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Enviando...
                    </>
                  ) : (
                    "Publicar Comentário"
                  )}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      ) : (
        <Alert variant="info" className="text-center">
          <div className="mb-2">
            <strong>Participe da conversa!</strong>
          </div>
          <p className="mb-3">
            Faça login para comentar e compartilhar suas opiniões.
          </p>
          <Button variant="primary" onClick={handleLoginRedirect} size="sm">
            Fazer Login para Comentar
          </Button>
        </Alert>
      )}

      {/* Comments List */}
      <div className="comments-list">
        {comments.length === 0 ? (
          <div className="text-center text-muted py-4">
            <p>Ainda não há comentários. Seja o primeiro a comentar!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <Card key={comment.id} className="comment-card mb-3">
              <Card.Body>
                <div className="comment-header d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <strong className="comment-author">
                      {comment.nickname || comment.full_name || "Anonymous"}
                    </strong>
                    <small
                      className="text-muted ms-2"
                      data-testid="comment-date"
                    >
                      {formatDate(comment.created_at)}
                      {comment.updated_at !== comment.created_at && (
                        <span className="ms-1">(editado)</span>
                      )}
                    </small>
                  </div>
                  {user && user.id === comment.user_id && (
                    <div className="comment-actions">
                      <OTButton
                        variant="link"
                        className="text-muted p-0 me-2"
                        onClick={() => handleEditComment(comment)}
                        disabled={submitting}
                        imgSrc="/images/edit.png"
                        imgAlt="Editar"
                      >
                        Editar
                      </OTButton>
                      <OTButton
                        variant="link"
                        className="text-danger p-0"
                        onClick={() => handleDeleteComment(comment.id)}
                        disabled={submitting}
                        imgSrc="/images/delete.png"
                        imgAlt="Excluir"
                      >
                        Excluir
                      </OTButton>
                    </div>
                  )}
                </div>

                {editingComment === comment.id ? (
                  <Form>
                    <Form.Group className="mb-2">
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        maxLength={1000}
                        disabled={submitting}
                      />
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
          ))
        )}
      </div>
    </div>
  );
};

Comments.propTypes = {
  adId: PropTypes.string.isRequired,
};

export default Comments;
