import { useCallback, useEffect, useMemo, useState } from 'react';
import { deleteBook, getBooks } from '../../api/services/bookService';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { SearchBar } from '../../components/ui/SearchBar';
import { Table } from '../../components/ui/Table';
import { useToast } from '../../hooks/useToast';
import { BookFormModal } from './BookFormModal';
import styles from './BooksPage.module.css';

const ALL_CATEGORIES = 'ALL_CATEGORIES';

function unwrapList(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && Array.isArray(payload.data)) {
    return payload.data;
  }

  return [];
}

function getErrorMessage(error, fallbackMessage) {
  return (
    error?.response?.data?.errors?.[0] ??
    error?.response?.data?.message ??
    fallbackMessage
  );
}

function normalizeQuery(value) {
  return String(value ?? '').trim().toLowerCase();
}

function getAvailability(book) {
  const available = Number(book?.availableCopies);
  const total = Number(book?.totalCopies);
  const safeAvailable = Number.isFinite(available) && available >= 0 ? available : 0;
  const safeTotal = Number.isFinite(total) && total > 0 ? total : 0;
  const percent = safeTotal > 0 ? Math.min(100, Math.max(0, (safeAvailable / safeTotal) * 100)) : 0;

  return {
    available: safeAvailable,
    total: safeTotal,
    percent,
    isEmpty: safeAvailable === 0,
  };
}

function BookStackIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6.5 5.25h10.5a1.75 1.75 0 0 1 1.75 1.75v9.5A1.75 1.75 0 0 1 17 18.25H6.5A1.75 1.75 0 0 1 4.75 16.5V7A1.75 1.75 0 0 1 6.5 5.25Z" />
      <path d="M8 8.5h7.5" />
      <path d="M8 11.5h7.5" />
      <path d="M8 14.5h4.25" />
      <path d="M7 3.75h9.75" />
      <path d="M7.75 20.25h8.5" />
    </svg>
  );
}

export default function BooksPage() {
  const { showToast } = useToast();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [bookPendingDelete, setBookPendingDelete] = useState(null);

  const loadBooks = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) {
        setLoading(true);
      }

      try {
        const response = await getBooks();
        setBooks(unwrapList(response));
      } catch (error) {
        setBooks([]);
        showToast({
          type: 'error',
          message: getErrorMessage(
            error,
            'Could not load the books catalog. Please refresh and try again.'
          ),
        });
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  const categories = useMemo(() => {
    return [...new Set(books.map((book) => String(book?.category ?? '').trim()).filter(Boolean))].sort(
      (a, b) => a.localeCompare(b)
    );
  }, [books]);

  const filteredBooks = useMemo(() => {
    const query = normalizeQuery(searchQuery);

    return books.filter((book) => {
      const matchesCategory =
        selectedCategory === ALL_CATEGORIES || String(book?.category ?? '').trim() === selectedCategory;

      if (!matchesCategory) {
        return false;
      }

      if (!query) {
        return true;
      }

      const haystacks = [book?.title, book?.author, book?.isbn].map(normalizeQuery);
      return haystacks.some((value) => value.includes(query));
    });
  }, [books, searchQuery, selectedCategory]);

  const hasActiveFilters = searchQuery.trim() !== '' || selectedCategory !== ALL_CATEGORIES;
  const emptyMessage =
    books.length === 0
      ? 'No books are in the catalog yet. Add your first title to get started.'
      : 'No books match the current search and category filters.';

  const handleOpenCreate = useCallback(() => {
    setEditingBook(null);
    setIsFormOpen(true);
  }, []);

  const handleOpenEdit = useCallback((book) => {
    setEditingBook(book);
    setIsFormOpen(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    setEditingBook(null);
    setIsFormOpen(false);
  }, []);

  const handleOpenDelete = useCallback((book) => {
    setBookPendingDelete(book);
  }, []);

  const handleCloseDelete = useCallback(() => {
    setBookPendingDelete(null);
  }, []);

  const handleResetFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory(ALL_CATEGORIES);
  }, []);

  const handleBookSaved = useCallback(async () => {
    await loadBooks({ silent: true });
  }, [loadBooks]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!bookPendingDelete) {
      return false;
    }

    try {
      await deleteBook(bookPendingDelete.id);
      showToast({
        type: 'success',
        message: `"${bookPendingDelete.title}" was removed from the catalog.`,
      });
      await loadBooks({ silent: true });
      return true;
    } catch (error) {
      showToast({
        type: 'error',
        message: getErrorMessage(
          error,
          'This book could not be deleted right now. Please try again.'
        ),
      });
      return false;
    }
  }, [bookPendingDelete, loadBooks, showToast]);

  const columns = useMemo(
    () => [
      {
        key: 'title',
        label: 'Title',
        render: (row) => (
          <div className={styles.titleCell}>
            <span className={styles.bookTitle}>{row.title}</span>
            <span className={styles.bookMeta}>
              {Number(row.availableCopies) > 0 ? 'Available for lending' : 'All copies are on loan'}
            </span>
          </div>
        ),
      },
      {
        key: 'author',
        label: 'Author',
        render: (row) => <span className={styles.cellText}>{row.author}</span>,
      },
      {
        key: 'isbn',
        label: 'ISBN',
        render: (row) => <span className={styles.cellMuted}>{row.isbn}</span>,
      },
      {
        key: 'category',
        label: 'Category',
        render: (row) =>
          row.category ? (
            <Badge variant="info">{row.category}</Badge>
          ) : (
            <span className={styles.cellMuted}>Uncategorized</span>
          ),
      },
      {
        key: 'availability',
        label: 'Availability',
        render: (row) => {
          const availability = getAvailability(row);

          return (
            <div className={styles.availabilityCell}>
              <div className={styles.availabilitySummary}>
                <span className={styles.availabilityCount}>
                  {availability.available} / {availability.total}
                </span>
                <Badge variant={availability.isEmpty ? 'danger' : 'success'}>
                  {availability.isEmpty ? 'Unavailable' : 'In stock'}
                </Badge>
              </div>
              <div className={styles.availabilityTrack} aria-hidden="true">
                <span
                  className={[
                    styles.availabilityFill,
                    availability.isEmpty ? styles.availabilityFillDanger : styles.availabilityFillSuccess,
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  style={{ width: `${availability.percent}%` }}
                />
              </div>
            </div>
          );
        },
      },
      {
        key: 'actions',
        label: 'Actions',
        render: (row) => (
          <div className={styles.actionGroup}>
            <Button size="sm" variant="secondary" onClick={() => handleOpenEdit(row)}>
              Edit
            </Button>
            <Button size="sm" variant="danger" onClick={() => handleOpenDelete(row)}>
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [handleOpenDelete, handleOpenEdit]
  );

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Catalog management</p>
          <h1 className={styles.title}>Books</h1>
          <p className={styles.lede}>
            Search the shelves, adjust availability, and keep the collection current without leaving
            the catalog view.
          </p>
        </div>
        <Button size="lg" icon={<BookStackIcon />} onClick={handleOpenCreate}>
          Add Book
        </Button>
      </section>

      <Card
        title="Filter the catalog"
        subtitle="Search by title, author, or ISBN, then narrow the results by category."
        actions={
          <Button variant="ghost" onClick={handleResetFilters} disabled={!hasActiveFilters}>
            Reset filters
          </Button>
        }
      >
        <div className={styles.filterRow}>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by title, author, or ISBN"
            className={styles.searchField}
          />

          <div className={styles.selectField}>
            <label className={styles.selectLabel} htmlFor="books-category-filter">
              Category
            </label>
            <select
              id="books-category-filter"
              className={styles.select}
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
            >
              <option value={ALL_CATEGORIES}>All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className={styles.resultsSummary}>
          Showing {filteredBooks.length} of {books.length} {books.length === 1 ? 'book' : 'books'}.
        </p>
      </Card>

      <Card
        title="Library catalog"
        subtitle="Edit titles, monitor stock, and remove books that are no longer in circulation."
      >
        <Table
          ariaLabel="Books catalog table"
          columns={columns}
          data={filteredBooks}
          loading={loading}
          emptyMessage={emptyMessage}
        />
      </Card>

      <BookFormModal
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSaved={handleBookSaved}
        book={editingBook}
      />

      <ConfirmDialog
        isOpen={bookPendingDelete != null}
        onClose={handleCloseDelete}
        onConfirm={handleDeleteConfirm}
        title="Delete book"
        confirmText="Delete book"
        message={
          bookPendingDelete ? (
            <p className={styles.confirmMessage}>
              Delete <strong>{bookPendingDelete.title}</strong>? This removes the title from the
              catalog unless it still has active borrows.
            </p>
          ) : null
        }
      />
    </div>
  );
}
