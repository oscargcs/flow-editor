import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FlowCreate } from './flow-create';

describe('FlowCreate', () => {
  let component: FlowCreate;
  let fixture: ComponentFixture<FlowCreate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FlowCreate],
    }).compileComponents();

    fixture = TestBed.createComponent(FlowCreate);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
