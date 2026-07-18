package com.researchsystem.backend.notification;

import com.researchsystem.backend.domain.entity.Topic;
import com.researchsystem.backend.domain.entity.User;
import com.researchsystem.backend.domain.enums.TopicStatus;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class TopicStatusChangedEvent extends ApplicationEvent {
    private final Topic topic;
    private final TopicStatus oldStatus;
    private final TopicStatus newStatus;
    private final User actor;
    private final String feedbackMessage;

    public TopicStatusChangedEvent(Object source, Topic topic, TopicStatus oldStatus, TopicStatus newStatus, User actor, String feedbackMessage) {
        super(source);
        this.topic = topic;
        this.oldStatus = oldStatus;
        this.newStatus = newStatus;
        this.actor = actor;
        this.feedbackMessage = feedbackMessage;
    }
}
