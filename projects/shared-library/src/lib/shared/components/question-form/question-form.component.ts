import { Component, Input, Output, OnInit, OnChanges, OnDestroy, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, FormControl } from '@angular/forms';
import { Question, QuestionStatus, Category, User, Answer, ApplicationSettings } from '../../model';
import { QuestionService } from '../../../core/services';
import { Observable } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { AutoUnsubscribe } from 'ngx-auto-unsubscribe';
// import { QuillImageUpload } from 'ng-quill-tex/lib/models/quill-image-upload';
import { CropImageDialogComponent } from './../crop-image-dialog/crop-image-dialog.component';
import { MatDialog } from '@angular/material';
@Component({
  selector: 'app-question-form',
  templateUrl: './question-form.component.html',
  styleUrls: ['./question-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

@AutoUnsubscribe({ 'arrayName': 'subscriptions' })
export class QuestionFormComponent implements OnInit, OnChanges, OnDestroy {

  @Input() editQuestion: Question;
  @Input() tagsObs: Observable<string[]>;
  @Input() tagsDictionary: any; //{ [key: number]: Category };
  @Input() categoriesObs: any; //[[key: number]: ]; /// [key: number]: string };
  @Output() updateStatus = new EventEmitter<boolean>();
  @Output() updateUnpublishedQuestions = new EventEmitter<Question>();
  @Input() quillConfig: any;
  @Input() applicationSettings: ApplicationSettings;

  questionForm: FormGroup;
  // Properties
  categories: Category[];
  tags: string[];

  autoTags: string[] = []; // auto computed based on match within Q/A
  enteredTags: string[] = [];
  user: User;
  subscriptions = [];
  quillObject: any = {};
  dialogRef;

  get answers(): FormArray {
    return this.questionForm.get('answers') as FormArray;
  }
  get tagsArray(): FormArray {
    return this.questionForm.get('tagsArray') as FormArray;
  }

  constructor(
    private fb: FormBuilder,
    public dialog: MatDialog,
    public questionService: QuestionService) {


  }

  ngOnInit() {

    this.questionForm = this.fb.group({
      category: [(this.editQuestion.categories.length > 0 ? this.editQuestion.categories[0] : ''), Validators.required]
    });

    this.createForm(this.editQuestion);

    const questionControl = this.questionForm.get('questionText');
    this.subscriptions.push(questionControl.valueChanges.pipe(debounceTime(500)).subscribe(v => this.computeAutoTags()));
    this.subscriptions.push(this.answers.valueChanges.pipe(debounceTime(500)).subscribe(v => this.computeAutoTags()));
    this.subscriptions.push(this.categoriesObs.subscribe(categories => this.categories = categories));
    this.subscriptions.push(this.tagsObs.subscribe(tags => this.tags = tags));
  }


  ngOnChanges() {
    if (this.editQuestion) {
      this.createForm(this.editQuestion);
    }
  }

  createForm(question: Question) {
    const fgs: FormGroup[] = question.answers.map(answer => {
      const isRichEditor = (answer.isRichEditor) ? answer.isRichEditor : false;
      const answerText = (answer.isRichEditor) ? answer.answerObject : answer.answerText;
      const fg = new FormGroup({
        answerText: new FormControl(answerText, Validators.required),
        correct: new FormControl(answer.correct),
        isRichEditor: new FormControl(isRichEditor),
        answerObject: new FormControl(answer.answerObject),
      });
      return fg;
    });
    const answersFA = new FormArray(fgs);

    let fcs: FormControl[] = question.tags.map(tag => {
      const fc = new FormControl(tag);
      return fc;
    });
    if (fcs.length === 0) {
      fcs = [new FormControl('')];
    }
    const tagsFA = new FormArray(fcs);
    const questionText = (question.isRichEditor) ? question.questionObject : question.questionText;

    if (question.isRichEditor) {
      this.quillObject.questionText =  question.questionText ;
      this.quillObject.jsonObject = question.questionObject;
    }
    this.questionForm = this.fb.group({
      category: [(question.categories.length > 0 ? question.categories[0] : ''), Validators.required],
      questionText: [questionText, Validators.required],
      tags: '',
      tagsArray: tagsFA,
      answers: answersFA,
      ordered: [question.ordered],
      explanation: [question.explanation],
      isRichEditor: question.isRichEditor,
      maxTime: (question.maxTime) ? question.maxTime : ''
    }, { validator: this.questionFormValidator }
    );

    this.questionForm.controls['category'].setValue(question.categoryIds);
    this.enteredTags = question.tags;
  }

  // Event Handlers
  addTag() {
    const tag = this.questionForm.get('tags').value;
    if (tag) {
      if (this.enteredTags.indexOf(tag) < 0) {
        this.enteredTags.push(tag);
      }
      this.questionForm.get('tags').setValue('');
    }
    this.setTagsArray();
  }

  removeEnteredTag(tag) {
    this.enteredTags = this.enteredTags.filter(t => t !== tag);
    this.setTagsArray();
  }

  computeAutoTags() {
    const formValue = this.questionForm.value;
    const allTextValues: string[] = [formValue.questionText];
    formValue.answers.forEach(answer => allTextValues.push(answer.answerText));
    const wordString: string = allTextValues.join(' ');
    const matchingTags: string[] = [];
    this.tags.forEach(tag => {
      const part = new RegExp('\\b(' + tag.replace('+', '\\+') + ')\\b', 'ig');
      if (wordString.match(part)) {
        matchingTags.push(tag);
      }
    });
    this.autoTags = matchingTags;
    this.setTagsArray();
  }

  setTagsArray() {
    this.tagsArray.controls = [];
    [...this.autoTags, ...this.enteredTags].forEach(tag => this.tagsArray.push(new FormControl(tag)));
  }

  onSubmit() {
    // validations
    this.questionForm.updateValueAndValidity();
    if (this.questionForm.invalid) {
      return;
    }

    // get question object from the forms
    const question: Question = this.getQuestionFromFormValue(this.questionForm.value);
    question.id = this.editQuestion.id;
    question.status = this.editQuestion.status === QuestionStatus.REQUIRED_CHANGE ? QuestionStatus.PENDING : this.editQuestion.status;
    question.bulkUploadId = this.editQuestion.bulkUploadId ? this.editQuestion.bulkUploadId : '';
    question.categoryIds = [];

    if (Array.isArray(this.questionForm.get('category').value)) {
      question.categoryIds = this.questionForm.get('category').value;
    } else {
      question.categoryIds.push(this.questionForm.get('category').value);
    }


    question.reason = this.editQuestion.reason ? this.editQuestion.reason : '';
    question.published = this.editQuestion.published ? this.editQuestion.published : false;
    question.created_uid = this.editQuestion.created_uid ? this.editQuestion.created_uid : this.user.userId;
    question.approved_uid = this.editQuestion.approved_uid ? this.editQuestion.approved_uid : '';
    question.explanation = this.editQuestion.explanation ? this.editQuestion.explanation : '';

    if (question.isRichEditor) {
      question.questionText = this.quillObject.questionText;
      question.questionObject = this.quillObject.jsonObject;
    }

    // call updateQuestion
    this.updateQuestion(question);
  }

  // Helper functions
  getQuestionFromFormValue(formValue: any): Question {
    let question: Question;
    question = new Question();
    question.questionText = formValue.questionText;
    question.answers = formValue.answers;
    question.categoryIds = this.questionForm.get('category').value;
    question.tags = [...this.autoTags, ...this.enteredTags];
    question.ordered = formValue.ordered;
    question.explanation = formValue.explanation;
    question.isRichEditor = formValue.isRichEditor;
    return question;
  }

  updateQuestion(question: Question) {
    this.updateUnpublishedQuestions.emit(question);
    this.updateStatus.emit(true);
  }

  questionFormValidator(fg: FormGroup): { [key: string]: boolean } {
    const answers: Answer[] = fg.get('answers').value;
    if (answers.filter(answer => answer.correct).length !== 1) {
      return { 'correctAnswerCountInvalid': true };
    }
    const tags: string[] = fg.get('tagsArray').value;
    if (tags.length < 3) {
      return { 'tagCountInvalid': true };
    }
    return null;
  }

  showQuestion() {
    this.updateStatus.emit(true);
  }

  trackById(index, item) {
    return item.id;
  }

  ngOnDestroy() {

  }

  onAnswerChanged(event, answerIndex) {
    const answers = (<FormArray>this.questionForm.get('answers'));
    answers.controls[answerIndex]['controls'].answerObject.patchValue(event.delta);
    answers.controls[answerIndex]['controls'].answerText.patchValue(event.html);
  }

  // Text change in quill editor
  onTextChanged(text) {
    this.quillObject.jsonObject = text.delta;
    this.quillObject.questionText = text.html;
  }

  // Image Upload
  fileUploaded(quillImageUpload: any) {
    const file: File = quillImageUpload.file;

    this.dialogRef = this.dialog.open(CropImageDialogComponent, {
      disableClose: false,
      data: { file: file, applicationSettings: this.applicationSettings }
    });

    this.dialogRef.componentInstance.ref = this.dialogRef;
    this.subscriptions.push(this.dialogRef.componentInstance.ref.afterClosed().subscribe(result => {
      if (result) {
        const fileName = `questions/${new Date().getTime()}-${file.name}`;
        this.questionService.saveQuestionImage(result.image, fileName).subscribe(uploadTask => {
          if (uploadTask != null) {
            if (uploadTask.task.snapshot.state === 'success') {
              this.questionService.getQuestionDownloadUrl(fileName).subscribe(imageUrl => {
                quillImageUpload.setImage(imageUrl);
              });
            }
          }
        });
      }
    }));
  }

}
