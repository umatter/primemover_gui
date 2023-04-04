import {
  EntityAction,
  EntityCollection,
  EntityCollectionReducerMethodMap,
  EntityCollectionReducerMethods,
  EntityDefinition,
  EntityDefinitionService
} from '@ngrx/data';
import { Injectable } from '@angular/core';

export class AdditionalEntityCollectionReducerMethods<T> extends EntityCollectionReducerMethods<T> {
  constructor(public override entityName: string, public override definition: EntityDefinition<T>) {
    super(entityName, definition);
  }

  // use if additional data comes from the server
  protected override queryManySuccess(collection: EntityCollection<T>, action: EntityAction<T[]>): EntityCollection<T> {
    const ec = super.queryManySuccess(collection, action);
    if ((action.payload as any).additionalData) {
      (ec as any).additionalData = (action.payload as any).additionalData;
    }
    return ec;
  }
}

@Injectable()
export class AdditionalEntityCollectionReducerMethodsFactory {
  constructor(private entityDefinitionService: EntityDefinitionService) {}

  create<T>(entityName: string): EntityCollectionReducerMethodMap<T> {
    const definition = this.entityDefinitionService.getDefinition<T>(entityName);
    const methodsClass = new AdditionalEntityCollectionReducerMethods(entityName, definition);
    return methodsClass.methods;
  }
}
